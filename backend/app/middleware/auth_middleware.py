"""FastAPI dependencies for JWT auth and role checks."""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.entreprise import Entreprise
from app.services.auth_service import decode_token
import uuid

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user


def require_role(*roles: RoleEnum):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé",
            )
        return current_user
    return dependency


def get_current_etudiant(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.etudiant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux étudiants")
    return current_user


def get_current_entreprise(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.entreprise:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux entreprises")
    return current_user


def get_current_validated_entreprise(
    current_user: User = Depends(get_current_entreprise),
    db: Session = Depends(get_db),
) -> User:
    entreprise = db.query(Entreprise).filter(Entreprise.id == current_user.id).first()
    if not entreprise or not entreprise.valide:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte entreprise n'est pas encore validé par le club",
        )
    return current_user


def get_current_club(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.club:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé au club")
    return current_user
