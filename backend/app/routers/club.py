import uuid
import secrets
import string
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.etudiant import Etudiant
from app.models.entreprise import Entreprise
from app.models.annonce import Annonce, StatutAnnonce
from app.models.candidature import Candidature
from app.models.cv import CV
from app.models.notification import Notification
from app.models.annonce_validation_dept import AnnonceValidationDept
from app.models.embedding import Embedding, SourceType
from app.schemas.entreprise import EntrepriseListItem
from app.middleware.auth_middleware import get_current_club
from app.services.notification_service import create_notification
from app.services.auth_service import hash_password
from app.tasks.embed_annonce import embed_annonce_background


def _generate_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


class CreerEntrepriseRequest(BaseModel):
    email: str
    password: str
    nom_entreprise: str
    secteur: Optional[str] = None
    ville: Optional[str] = None


class CreerEtudiantRequest(BaseModel):
    email: str
    password: str
    nom: str
    prenom: str
    filiere: Optional[str] = None
    departement: Optional[str] = None
    niveau: Optional[str] = None

router = APIRouter(prefix="/club", tags=["Club"])


@router.get("/entreprises", response_model=List[EntrepriseListItem])
def list_entreprises(
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    entreprises = db.query(Entreprise).all()
    result = []
    for e in entreprises:
        user = db.query(User).filter(User.id == e.id).first()
        result.append(
            EntrepriseListItem(
                id=str(e.id),
                nom_entreprise=e.nom_entreprise,
                secteur=e.secteur,
                ville=e.ville,
                valide=e.valide,
                email=user.email if user else "",
            )
        )
    return result


@router.put("/entreprises/{entreprise_id}/valider")
def valider_entreprise(
    entreprise_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    entreprise = db.query(Entreprise).filter(Entreprise.id == uuid.UUID(entreprise_id)).first()
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    entreprise.valide = True
    entreprise.valide_par = current_user.id
    entreprise.valide_le = datetime.utcnow()

    create_notification(
        db,
        entreprise.id,
        "Compte validé",
        "Votre compte entreprise a été validé. Vous pouvez maintenant publier des offres de stage.",
    )

    db.commit()
    return {"message": "Entreprise validée avec succès"}


@router.put("/entreprises/{entreprise_id}/rejeter")
def rejeter_entreprise(
    entreprise_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    entreprise = db.query(Entreprise).filter(Entreprise.id == uuid.UUID(entreprise_id)).first()
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    entreprise.valide = False

    create_notification(
        db,
        entreprise.id,
        "Compte non validé",
        "Votre demande d'accès entreprise n'a pas été validée. Contactez le club EnimConnect pour plus d'informations.",
    )

    db.commit()
    return {"message": "Entreprise rejetée"}


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    total_entreprises = db.query(Entreprise).count()
    entreprises_validees = db.query(Entreprise).filter(Entreprise.valide == True).count()
    entreprises_en_attente = db.query(Entreprise).filter(Entreprise.valide == False).count()

    total_annonces = db.query(Annonce).count()
    annonces_en_attente = db.query(Annonce).filter(Annonce.statut == StatutAnnonce.en_attente).count()
    annonces_validees = db.query(Annonce).filter(Annonce.statut == StatutAnnonce.validee).count()
    annonces_rejetees = db.query(Annonce).filter(Annonce.statut == StatutAnnonce.rejetee).count()

    total_candidatures = db.query(Candidature).count()

    return {
        "entreprises": {
            "total": total_entreprises,
            "validees": entreprises_validees,
            "en_attente": entreprises_en_attente,
        },
        "annonces": {
            "total": total_annonces,
            "en_attente": annonces_en_attente,
            "validees": annonces_validees,
            "rejetees": annonces_rejetees,
        },
        "candidatures": {
            "total": total_candidatures,
        },
    }


@router.get("/annonces", response_model=List[dict])
def list_annonces(
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    annonces = db.query(Annonce).order_by(Annonce.created_at.desc()).all()
    result = []
    for a in annonces:
        entreprise = db.query(Entreprise).filter(Entreprise.id == a.entreprise_id).first()
        validations = []
        for v in a.validations_dept:
            validations.append({
                "departement": v.departement,
                "statut": v.statut,
                "motif": v.motif,
                "validated_at": v.validated_at.isoformat() if v.validated_at else None,
                "chef_nom": v.chef.nom if v.chef else None,
            })
        result.append({
            "id": str(a.id),
            "titre": a.titre,
            "description": a.description,
            "statut": a.statut,
            "is_active": a.is_active,
            "entreprise_id": str(a.entreprise_id),
            "departement": a.departement,
            "departements": a.departements or [],
            "duree_mois": a.duree_mois,
            "nom_entreprise": entreprise.nom_entreprise if entreprise else None,
            "ville": entreprise.ville if entreprise else None,
            "created_at": a.created_at.isoformat(),
            "validations_dept": validations,
        })
    return result


@router.put("/annonces/{annonce_id}/valider")
def valider_annonce_club(
    annonce_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    annonce = db.query(Annonce).filter(Annonce.id == uuid.UUID(annonce_id)).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if annonce.statut == StatutAnnonce.validee:
        raise HTTPException(status_code=400, detail="Annonce déjà validée")

    annonce.statut = StatutAnnonce.validee
    annonce.is_active = True
    annonce.validee_le = datetime.utcnow()

    create_notification(
        db,
        annonce.entreprise_id,
        "Offre validée",
        f"Votre offre « {annonce.titre} » a été validée et est maintenant visible par les étudiants.",
    )

    db.commit()

    background_tasks.add_task(embed_annonce_background, annonce_id)
    return {"message": "Annonce validée avec succès"}


@router.put("/annonces/{annonce_id}/rejeter")
def rejeter_annonce_club(
    annonce_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    annonce = db.query(Annonce).filter(Annonce.id == uuid.UUID(annonce_id)).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if annonce.statut == StatutAnnonce.rejetee:
        raise HTTPException(status_code=400, detail="Annonce déjà rejetée")

    annonce.statut = StatutAnnonce.rejetee
    annonce.is_active = False

    create_notification(
        db,
        annonce.entreprise_id,
        "Offre rejetée",
        f"Votre offre « {annonce.titre} » a été rejetée. Contactez le club EnimConnect pour plus d'informations.",
    )

    db.commit()
    return {"message": "Annonce rejetée"}


@router.post("/creer-entreprise", status_code=201)
def creer_entreprise(
    body: CreerEntrepriseRequest,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=RoleEnum.entreprise,
        is_active=True,
    )
    db.add(user)
    db.flush()

    entreprise = Entreprise(
        id=user.id,
        nom_entreprise=body.nom_entreprise,
        secteur=body.secteur,
        ville=body.ville,
        valide=True,
        valide_par=current_user.id,
        valide_le=datetime.utcnow(),
    )
    db.add(entreprise)

    create_notification(
        db,
        user.id,
        "Compte créé",
        f"Votre compte entreprise pour « {body.nom_entreprise} » a été créé et validé par l'équipe EnimConnect.",
    )

    db.commit()
    return {"message": "Compte entreprise créé avec succès", "id": str(user.id)}


@router.post("/creer-etudiant", status_code=201)
def creer_etudiant(
    body: CreerEtudiantRequest,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=RoleEnum.etudiant,
        is_active=True,
    )
    db.add(user)
    db.flush()

    etudiant = Etudiant(
        id=user.id,
        nom=body.nom,
        prenom=body.prenom,
        filiere=body.filiere,
        departement=body.departement,
        niveau=body.niveau,
    )
    db.add(etudiant)
    db.commit()
    return {"message": "Compte étudiant créé avec succès", "id": str(user.id)}


@router.put("/etudiants/{etudiant_id}/reset-password")
def reset_etudiant_password(
    etudiant_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(etudiant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    user = db.query(User).filter(User.id == uid, User.role == RoleEnum.etudiant).first()
    if not user:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    new_password = _generate_password()
    user.password_hash = hash_password(new_password)
    db.commit()
    return {"nouveau_mot_de_passe": new_password}


@router.put("/entreprises/{entreprise_id}/reset-password")
def reset_entreprise_password(
    entreprise_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(entreprise_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    user = db.query(User).filter(User.id == uid, User.role == RoleEnum.entreprise).first()
    if not user:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    new_password = _generate_password()
    user.password_hash = hash_password(new_password)
    db.commit()

    return {"nouveau_mot_de_passe": new_password}


@router.get("/etudiants")
def list_etudiants(
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    etudiants = db.query(Etudiant).all()
    result = []
    for e in etudiants:
        user = db.query(User).filter(User.id == e.id).first()
        cv = db.query(CV).filter(CV.etudiant_id == e.id).first()
        result.append({
            "etudiant_id": str(e.id),
            "nom": e.nom,
            "prenom": e.prenom,
            "email": user.email if user else "",
            "filiere": e.filiere,
            "departement": e.departement,
            "niveau": e.niveau,
            "competences": e.competences or [],
            "a_un_cv": cv is not None,
        })
    return result


@router.get("/stats/etudiants")
def stats_etudiants(
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    etudiants = db.query(Etudiant).all()

    par_dept: dict = {}
    par_niveau: dict = {"1A": 0, "2A": 0, "3A": 0, "Non renseigné": 0}
    avec_cv = 0

    for e in etudiants:
        dept = e.departement or "Non renseigné"
        par_dept[dept] = par_dept.get(dept, 0) + 1
        niv = e.niveau if e.niveau else "Non renseigné"
        par_niveau[niv] = par_niveau.get(niv, 0) + 1
        cv = db.query(CV).filter(CV.etudiant_id == e.id).first()
        if cv:
            avec_cv += 1

    return {
        "total": len(etudiants),
        "avec_cv": avec_cv,
        "sans_cv": len(etudiants) - avec_cv,
        "par_departement": par_dept,
        "par_niveau": par_niveau,
    }


@router.delete("/etudiants/{etudiant_id}", status_code=200)
def supprimer_etudiant(
    etudiant_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(etudiant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    user = db.query(User).filter(User.id == uid, User.role == RoleEnum.etudiant).first()
    if not user:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    # Delete CV embedding
    cv = db.query(CV).filter(CV.etudiant_id == uid).first()
    if cv:
        db.query(Embedding).filter(
            Embedding.source_type == SourceType.cv,
            Embedding.source_id == cv.id,
        ).delete(synchronize_session=False)
        db.delete(cv)

    # Candidatures (FK cascade from DB but explicit for safety)
    db.query(Candidature).filter(Candidature.etudiant_id == uid).delete(synchronize_session=False)

    # Notifications (FK cascade from DB but explicit for safety)
    db.query(Notification).filter(Notification.user_id == uid).delete(synchronize_session=False)

    etudiant = db.query(Etudiant).filter(Etudiant.id == uid).first()
    if etudiant:
        db.delete(etudiant)

    db.delete(user)
    db.commit()
    return {"message": "Compte étudiant supprimé définitivement"}


@router.get("/entreprises-avec-offres")
def list_entreprises_avec_offres(
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    entreprises = db.query(Entreprise).all()
    result = []
    for e in entreprises:
        user = db.query(User).filter(User.id == e.id).first()
        nb_offres = db.query(Annonce).filter(Annonce.entreprise_id == e.id).count()
        result.append({
            "id": str(e.id),
            "nom_entreprise": e.nom_entreprise,
            "secteur": e.secteur,
            "ville": e.ville,
            "valide": e.valide,
            "email": user.email if user else "",
            "nb_offres": nb_offres,
        })
    return result


@router.get("/entreprises/{entreprise_id}/annonces")
def list_annonces_entreprise(
    entreprise_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(entreprise_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    entreprise = db.query(Entreprise).filter(Entreprise.id == uid).first()
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    annonces = db.query(Annonce).filter(Annonce.entreprise_id == uid).order_by(Annonce.created_at.desc()).all()
    result = []
    for a in annonces:
        validations = []
        for v in a.validations_dept:
            validations.append({
                "departement": v.departement,
                "statut": v.statut,
                "motif": v.motif,
                "validated_at": v.validated_at.isoformat() if v.validated_at else None,
                "chef_nom": v.chef.nom if v.chef else None,
            })
        result.append({
            "id": str(a.id),
            "titre": a.titre,
            "description": a.description,
            "departement": a.departement,
            "departements": a.departements or [],
            "duree_mois": a.duree_mois,
            "statut": a.statut,
            "is_active": a.is_active,
            "created_at": a.created_at.isoformat(),
            "nom_entreprise": entreprise.nom_entreprise,
            "ville": entreprise.ville,
            "validations_dept": validations,
        })
    return result


@router.put("/annonces/{annonce_id}/toggle-actif")
def toggle_annonce_actif(
    annonce_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(annonce_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    annonce = db.query(Annonce).filter(Annonce.id == uid).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    annonce.is_active = not annonce.is_active
    db.commit()
    return {
        "is_active": annonce.is_active,
        "message": "Offre activée" if annonce.is_active else "Offre désactivée",
    }


@router.delete("/entreprises/{entreprise_id}", status_code=200)
def supprimer_entreprise(
    entreprise_id: str,
    current_user: User = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(entreprise_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    user = db.query(User).filter(User.id == uid, User.role == RoleEnum.entreprise).first()
    if not user:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")

    # Delete annonces and their embeddings/validations/candidatures
    annonces = db.query(Annonce).filter(Annonce.entreprise_id == uid).all()
    for annonce in annonces:
        db.query(Embedding).filter(
            Embedding.source_type == SourceType.annonce,
            Embedding.source_id == annonce.id,
        ).delete(synchronize_session=False)
        db.query(Candidature).filter(Candidature.annonce_id == annonce.id).delete(synchronize_session=False)
        db.query(AnnonceValidationDept).filter(
            AnnonceValidationDept.annonce_id == annonce.id
        ).delete(synchronize_session=False)
        db.delete(annonce)

    db.query(Notification).filter(Notification.user_id == uid).delete(synchronize_session=False)

    entreprise = db.query(Entreprise).filter(Entreprise.id == uid).first()
    if entreprise:
        db.delete(entreprise)

    db.delete(user)
    db.commit()
    return {"message": "Compte entreprise supprimé définitivement"}
