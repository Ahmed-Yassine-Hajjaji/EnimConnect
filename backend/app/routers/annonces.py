import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.limiter import limiter
from app.database import get_db
from app.models.user import User
from app.models.annonce import Annonce, StatutAnnonce
from app.models.annonce_validation_dept import AnnonceValidationDept, StatutValidationDept
from app.models.candidature import Candidature
from app.models.entreprise import Entreprise
from app.models.etudiant import Etudiant
from app.models.cv import CV
from app.schemas.annonce import AnnonceOut, AnnonceDetail
from app.middleware.auth_middleware import get_current_user, get_current_etudiant
from app.services.matching_service import get_annonces_sorted_by_cv, get_annonces_sorted_by_cv_for_dept
from app.services.notification_service import create_notification

router = APIRouter(prefix="/annonces", tags=["Annonces"])


def _build_annonce_out(annonce: Annonce, entreprises_map: dict) -> AnnonceOut:
    entreprise = entreprises_map.get(annonce.entreprise_id)
    return AnnonceOut(
        id=str(annonce.id),
        entreprise_id=str(annonce.entreprise_id),
        titre=annonce.titre,
        description=annonce.description,
        departement=annonce.departement,
        duree_mois=annonce.duree_mois,
        statut=annonce.statut,
        is_active=annonce.is_active,
        created_at=annonce.created_at,
        nom_entreprise=entreprise.nom_entreprise if entreprise else None,
        ville=entreprise.ville if entreprise else None,
    )


def _annonce_to_out(annonce: Annonce, db: Session) -> AnnonceOut:
    entreprise = db.query(Entreprise).filter(Entreprise.id == annonce.entreprise_id).first()
    return _build_annonce_out(annonce, {annonce.entreprise_id: entreprise})


@router.get("", response_model=list[AnnonceOut])
@limiter.limit("30/hour")
def list_annonces(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List annonces visible by the current user.
    - Étudiant: only sees annonces validated for their specific department (AnnonceValidationDept).
    - Others: all active validated annonces.
    Sorted by AI cosine similarity if student has a CV.
    """
    from app.models.user import RoleEnum

    if current_user.role == RoleEnum.etudiant:
        etudiant = db.query(Etudiant).filter(Etudiant.id == current_user.id).first()
        dept = etudiant.departement if etudiant else None

        if dept:
            # Only annonces where this department has been validated
            validated_annonce_ids = {
                str(v.annonce_id)
                for v in db.query(AnnonceValidationDept).filter(
                    AnnonceValidationDept.departement == dept,
                    AnnonceValidationDept.statut == StatutValidationDept.validee,
                ).all()
            }
            sorted_annonces = get_annonces_sorted_by_cv_for_dept(
                db, current_user.id, validated_annonce_ids
            )
        else:
            # No department set → show all validated (fallback for new students)
            sorted_annonces = get_annonces_sorted_by_cv(db, current_user.id)
    else:
        sorted_annonces = (
            db.query(Annonce)
            .filter(Annonce.statut == StatutAnnonce.validee, Annonce.is_active == True)
            .all()
        )

    # Load all entreprises in one query
    entreprise_ids = list({a.entreprise_id for a in sorted_annonces})
    entreprises_map = {
        e.id: e for e in db.query(Entreprise).filter(Entreprise.id.in_(entreprise_ids)).all()
    }

    return [_build_annonce_out(a, entreprises_map) for a in sorted_annonces]


@router.get("/{annonce_id}", response_model=AnnonceDetail)
def get_annonce(
    annonce_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    annonce = db.query(Annonce).filter(Annonce.id == uuid.UUID(annonce_id)).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if annonce.statut != StatutAnnonce.validee or not annonce.is_active:
        raise HTTPException(status_code=404, detail="Annonce non disponible")

    out = _annonce_to_out(annonce, db)
    return AnnonceDetail(**out.model_dump(), motif=annonce.motif)


@router.post("/{annonce_id}/postuler", status_code=status.HTTP_201_CREATED)
def postuler(
    annonce_id: str,
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    annonce = db.query(Annonce).filter(Annonce.id == uuid.UUID(annonce_id)).first()
    if not annonce or annonce.statut != StatutAnnonce.validee or not annonce.is_active:
        raise HTTPException(status_code=404, detail="Annonce non disponible")

    # Vérifier que l'étudiant a un CV uploadé
    cv = db.query(CV).filter(CV.etudiant_id == current_user.id).first()
    if not cv:
        raise HTTPException(
            status_code=403,
            detail="Vous devez uploader votre CV avant de pouvoir postuler à une offre.",
        )

    existing = (
        db.query(Candidature)
        .filter(
            Candidature.etudiant_id == current_user.id,
            Candidature.annonce_id == annonce.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Vous avez déjà postulé à cette annonce")

    candidature = Candidature(
        etudiant_id=current_user.id,
        annonce_id=annonce.id,
    )
    db.add(candidature)

    # Notifier l'entreprise propriétaire de l'annonce
    from app.models.etudiant import Etudiant
    etudiant = db.query(Etudiant).filter(Etudiant.id == current_user.id).first()
    nom = f"{etudiant.prenom} {etudiant.nom}".strip() if etudiant else "Un étudiant"
    create_notification(
        db,
        annonce.entreprise_id,
        "Nouveau candidat",
        f"{nom} a postulé à « {annonce.titre} »",
    )

    db.commit()
    return {"message": "Candidature envoyée avec succès", "candidature_id": str(candidature.id)}


@router.delete("/{annonce_id}/postuler", status_code=status.HTTP_204_NO_CONTENT)
def retirer_candidature(
    annonce_id: str,
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    candidature = (
        db.query(Candidature)
        .filter(
            Candidature.etudiant_id == current_user.id,
            Candidature.annonce_id == uuid.UUID(annonce_id),
        )
        .first()
    )
    if not candidature:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    db.delete(candidature)
    db.commit()
