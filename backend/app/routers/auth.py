from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.etudiant import Etudiant
from app.models.entreprise import Entreprise
from app.schemas.user import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, AccessTokenResponse,
)
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.middleware.auth_middleware import get_current_user


class ChangePasswordRequest(BaseModel):
    ancien_mot_de_passe: str
    nouveau_mot_de_passe: str

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.flush()

    if body.role == RoleEnum.etudiant:
        etudiant = Etudiant(id=user.id, nom="", prenom="")
        db.add(etudiant)
    elif body.role == RoleEnum.entreprise:
        entreprise = Entreprise(id=user.id, nom_entreprise="")
        db.add(entreprise)
        from app.services.notification_service import notify_all_club
        notify_all_club(
            db,
            "Nouvelle entreprise inscrite",
            f"Une nouvelle entreprise ({body.email}) vient de créer un compte et attend validation.",
        )

    db.commit()
    return {"message": "Compte créé avec succès"}


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    token_data = {"sub": str(user.id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token invalide")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    token_data = {"sub": str(user.id), "role": user.role}
    return AccessTokenResponse(access_token=create_access_token(token_data))


@router.post("/logout")
def logout():
    # Stateless JWT — client just discards tokens
    return {"message": "Déconnecté"}


@router.put("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.ancien_mot_de_passe, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    if len(body.nouveau_mot_de_passe) < 8:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 8 caractères")
    current_user.password_hash = hash_password(body.nouveau_mot_de_passe)
    db.commit()
    return {"message": "Mot de passe modifié avec succès"}
