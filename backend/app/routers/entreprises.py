import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.entreprise import Entreprise
from app.models.annonce import Annonce, StatutAnnonce
from app.models.annonce_validation_dept import AnnonceValidationDept, StatutValidationDept
from app.models.candidature import Candidature
from app.models.etudiant import Etudiant
from app.models.cv import CV
from app.models.chef_departement import ChefDepartement
from app.schemas.entreprise import EntrepriseUpdate, EntrepriseOut
from app.schemas.annonce import AnnonceCreate, AnnonceUpdate, AnnonceOut, AnnonceDetail, ValidationDeptOut
from app.schemas.candidature import CandidatOut
from app.middleware.auth_middleware import (
    get_current_entreprise, get_current_validated_entreprise
)
from app.services.matching_service import get_candidats_sorted_by_annonce
from app.services.notification_service import create_notification, notify_all_club
from app.services.n8n_service import send_validation_webhook, build_chef_links_dept
from app.tasks.embed_annonce import embed_annonce_background

router = APIRouter(prefix="/entreprises", tags=["Entreprises"])


@router.get("/me", response_model=EntrepriseOut)
def get_my_profile(
    current_user: User = Depends(get_current_entreprise),
    db: Session = Depends(get_db),
):
    entreprise = db.query(Entreprise).filter(Entreprise.id == current_user.id).first()
    if not entreprise:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    data = EntrepriseOut.model_validate(entreprise)
    data.email = current_user.email
    return data


@router.put("/me", response_model=EntrepriseOut)
def update_my_profile(
    body: EntrepriseUpdate,
    current_user: User = Depends(get_current_entreprise),
    db: Session = Depends(get_db),
):
    entreprise = db.query(Entreprise).filter(Entreprise.id == current_user.id).first()
    if not entreprise:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(entreprise, field, value)
    db.commit()
    db.refresh(entreprise)
    data = EntrepriseOut.model_validate(entreprise)
    data.email = current_user.email
    return data


@router.post("/annonces", status_code=status.HTTP_201_CREATED)
async def create_annonce(
    body: AnnonceCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_validated_entreprise),
    db: Session = Depends(get_db),
):
    entreprise = db.query(Entreprise).filter(Entreprise.id == current_user.id).first()
    nom_e = entreprise.nom_entreprise if entreprise else "Une entreprise"

    # Ensure departements list is consistent
    depts = list(dict.fromkeys(body.departements))  # deduplicate, preserve order
    if not depts:
        depts = [body.departement]

    annonce = Annonce(
        entreprise_id=current_user.id,
        titre=body.titre,
        description=body.description,
        departement=depts[0],
        departements=depts,
        duree_mois=body.duree_mois,
    )
    db.add(annonce)
    db.flush()  # Get annonce.id

    # Create one AnnonceValidationDept per targeted department
    # and collect chefs for N8n webhook
    departements_chefs_payload = []
    for dept in depts:
        validation = AnnonceValidationDept(
            annonce_id=annonce.id,
            departement=dept,
            statut=StatutValidationDept.en_attente,
        )
        db.add(validation)
        db.flush()  # Get validation.id

        chefs = db.query(ChefDepartement).filter(
            ChefDepartement.departement == dept
        ).all()

        chefs_data = []
        for chef in chefs:
            links = build_chef_links_dept(str(validation.id), str(chef.id))
            chefs_data.append({
                "nom": chef.nom,
                "email": chef.email,
                "lien_decision": links["lien_decision"],
                "lien_valider": links["lien_valider"],
                "lien_refuser_form": links["lien_refuser_form"],
            })

        departements_chefs_payload.append({
            "departement": dept,
            "validation_id": str(validation.id),
            "chefs": chefs_data,
        })

    notify_all_club(
        db,
        "Nouvelle offre à valider",
        f"{nom_e} a soumis l'offre « {body.titre} » pour {len(depts)} département(s).",
    )

    db.commit()
    db.refresh(annonce)

    # Send N8n webhook asynchronously
    background_tasks.add_task(
        send_validation_webhook,
        str(annonce.id),
        annonce.titre,
        annonce.description,
        nom_e,
        departements_chefs_payload,
    )

    return {"message": "Annonce soumise, en attente de validation.", "annonce_id": str(annonce.id)}


@router.get("/annonces", response_model=List[AnnonceDetail])
def get_my_annonces(
    current_user: User = Depends(get_current_entreprise),
    db: Session = Depends(get_db),
):
    annonces = db.query(Annonce).filter(Annonce.entreprise_id == current_user.id).all()
    entreprise = db.query(Entreprise).filter(Entreprise.id == current_user.id).first()
    result = []
    for a in annonces:
        vd = [
            ValidationDeptOut(
                departement=v.departement,
                statut=v.statut,
                motif=v.motif,
                validated_at=v.validated_at,
                chef_nom=v.chef.nom if v.chef else None,
            )
            for v in a.validations_dept
        ]
        result.append(
            AnnonceDetail(
                id=str(a.id),
                entreprise_id=str(a.entreprise_id),
                titre=a.titre,
                description=a.description,
                departement=a.departement,
                departements=a.departements,
                duree_mois=a.duree_mois,
                statut=a.statut,
                is_active=a.is_active,
                created_at=a.created_at,
                motif=a.motif,
                nom_entreprise=entreprise.nom_entreprise if entreprise else None,
                ville=entreprise.ville if entreprise else None,
                validations_dept=vd,
            )
        )
    return result


@router.put("/annonces/{annonce_id}", response_model=AnnonceDetail)
def update_annonce(
    annonce_id: str,
    body: AnnonceUpdate,
    current_user: User = Depends(get_current_validated_entreprise),
    db: Session = Depends(get_db),
):
    annonce = (
        db.query(Annonce)
        .filter(Annonce.id == uuid.UUID(annonce_id), Annonce.entreprise_id == current_user.id)
        .first()
    )
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if annonce.statut == StatutAnnonce.validee:
        raise HTTPException(status_code=400, detail="Une annonce validée ne peut pas être modifiée")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(annonce, field, value)
    db.commit()
    db.refresh(annonce)
    return AnnonceDetail(
        id=str(annonce.id),
        entreprise_id=str(annonce.entreprise_id),
        titre=annonce.titre,
        description=annonce.description,
        departement=annonce.departement,
        duree_mois=annonce.duree_mois,
        statut=annonce.statut,
        is_active=annonce.is_active,
        created_at=annonce.created_at,
        motif=annonce.motif,
    )


@router.delete("/annonces/{annonce_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annonce(
    annonce_id: str,
    current_user: User = Depends(get_current_validated_entreprise),
    db: Session = Depends(get_db),
):
    annonce = (
        db.query(Annonce)
        .filter(Annonce.id == uuid.UUID(annonce_id), Annonce.entreprise_id == current_user.id)
        .first()
    )
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    db.delete(annonce)
    db.commit()


@router.get("/annonces/{annonce_id}/candidatures", response_model=List[CandidatOut])
def get_candidatures(
    annonce_id: str,
    current_user: User = Depends(get_current_validated_entreprise),
    db: Session = Depends(get_db),
):
    annonce = (
        db.query(Annonce)
        .filter(Annonce.id == uuid.UUID(annonce_id), Annonce.entreprise_id == current_user.id)
        .first()
    )
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    sorted_results = get_candidats_sorted_by_annonce(db, annonce.id)
    result = []
    for cand, etudiant, cv in sorted_results:
        if not etudiant:
            continue
        user = db.query(User).filter(User.id == etudiant.id).first()
        result.append(
            CandidatOut(
                etudiant_id=str(etudiant.id),
                nom=etudiant.nom,
                prenom=etudiant.prenom,
                email=user.email if user else "",
                niveau=etudiant.niveau,
                filiere=etudiant.filiere,
                competences=etudiant.competences or [],
                photo_url=etudiant.photo_url,
                cv_url=f"/api/cv/{etudiant.id}" if cv else None,
                description_cv=cv.description_ia if cv else None,
                date_candidature=cand.date,
            )
        )
    return result


@router.get("/recherche", response_model=List)
def recherche_etudiants(
    departement: Optional[str] = Query(None),
    niveau: Optional[str] = Query(None),
    current_user: User = Depends(get_current_validated_entreprise),
    db: Session = Depends(get_db),
):
    query = db.query(Etudiant).filter(
        Etudiant.nom.isnot(None), Etudiant.nom != "",
        Etudiant.prenom.isnot(None), Etudiant.prenom != "",
    )
    if departement:
        query = query.filter(Etudiant.departement == departement)
    if niveau:
        query = query.filter(Etudiant.niveau == niveau)
    etudiants = query.all()

    result = []
    for e in etudiants:
        user = db.query(User).filter(User.id == e.id).first()
        cv = db.query(CV).filter(CV.etudiant_id == e.id).first()
        result.append({
            "etudiant_id": str(e.id),
            "nom": e.nom,
            "prenom": e.prenom,
            "email": user.email if user else "",
            "niveau": e.niveau,
            "filiere": e.filiere,
            "departement": e.departement,
            "competences": e.competences or [],
            "photo_url": e.photo_url,
            "a_un_cv": cv is not None,
        })
    return result
