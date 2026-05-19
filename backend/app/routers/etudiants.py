import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.etudiant import Etudiant
from app.models.cv import CV
from app.models.candidature import Candidature
from app.models.annonce import Annonce
from app.models.entreprise import Entreprise
from app.schemas.etudiant import EtudiantUpdate, EtudiantOut, CVOut
from app.schemas.candidature import CandidatureOut
from app.middleware.auth_middleware import get_current_etudiant, get_current_user
from app.tasks.analyze_cv import analyze_cv_background
from app.config import settings
from app.limiter import limiter

router = APIRouter(prefix="/etudiants", tags=["Étudiants"])


@router.get("/me", response_model=EtudiantOut)
def get_my_profile(
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    etudiant = db.query(Etudiant).filter(Etudiant.id == current_user.id).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    data = EtudiantOut.model_validate(etudiant)
    data.email = current_user.email
    return data


@router.put("/me", response_model=EtudiantOut)
def update_my_profile(
    body: EtudiantUpdate,
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    etudiant = db.query(Etudiant).filter(Etudiant.id == current_user.id).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(etudiant, field, value)
    db.commit()
    db.refresh(etudiant)
    data = EtudiantOut.model_validate(etudiant)
    data.email = current_user.email
    return data


@router.post("/me/photo")
def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Format d'image non supporté (jpeg, png, webp)")

    photos_dir = os.path.join(settings.STORAGE_PATH, "photos")
    os.makedirs(photos_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}.{ext}"
    path = os.path.join(photos_dir, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    etudiant = db.query(Etudiant).filter(Etudiant.id == current_user.id).first()
    etudiant.photo_url = f"/storage/photos/{filename}"
    db.commit()

    return {"photo_url": etudiant.photo_url}


@router.post("/me/cv")
@limiter.limit("3/hour")
def upload_cv(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    consentement_ia: bool = Form(True),
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")

    if not consentement_ia:
        raise HTTPException(
            status_code=400,
            detail="L'analyse IA est requise pour activer le matching. Veuillez accepter le consentement.",
        )

    cvs_dir = os.path.join(settings.STORAGE_PATH, "cvs")
    os.makedirs(cvs_dir, exist_ok=True)

    filename = f"{current_user.id}.pdf"
    path = os.path.join(cvs_dir, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    existing_cv = db.query(CV).filter(CV.etudiant_id == current_user.id).first()
    if existing_cv:
        existing_cv.fichier_url = path
        existing_cv.description_ia = None
        existing_cv.consentement_ia = consentement_ia
        db.commit()
        cv_id = str(existing_cv.id)
    else:
        cv = CV(
            etudiant_id=current_user.id,
            fichier_url=path,
            consentement_ia=consentement_ia,
        )
        db.add(cv)
        db.commit()
        db.refresh(cv)
        cv_id = str(cv.id)

    # AI analysis runs in background only if user consented
    background_tasks.add_task(analyze_cv_background, cv_id)

    return {"message": "CV uploadé. Analyse IA en cours en arrière-plan.", "cv_id": cv_id}


@router.get("/me/cv", response_model=CVOut)
def get_my_cv(
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    cv = db.query(CV).filter(CV.etudiant_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="Aucun CV trouvé")
    return CVOut(
        id=str(cv.id),
        fichier_url=f"/api/cv/{current_user.id}",
        description_ia=cv.description_ia,
        uploaded_at=cv.uploaded_at,
        consentement_ia=cv.consentement_ia,
    )


@router.get("/me/candidatures", response_model=list[CandidatureOut])
def get_my_candidatures(
    current_user: User = Depends(get_current_etudiant),
    db: Session = Depends(get_db),
):
    candidatures = (
        db.query(Candidature)
        .filter(Candidature.etudiant_id == current_user.id)
        .all()
    )
    result = []
    for c in candidatures:
        annonce = db.query(Annonce).filter(Annonce.id == c.annonce_id).first()
        entreprise = db.query(Entreprise).filter(Entreprise.id == annonce.entreprise_id).first() if annonce else None
        result.append(
            CandidatureOut(
                id=str(c.id),
                etudiant_id=str(c.etudiant_id),
                annonce_id=str(c.annonce_id),
                date=c.date,
                titre_annonce=annonce.titre if annonce else None,
                nom_entreprise=entreprise.nom_entreprise if entreprise else None,
            )
        )
    return result


cv_router = APIRouter(tags=["CVs"])


@cv_router.get("/api/cv/{etudiant_id}")
def get_cv_file(
    etudiant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sert le CV PDF d'un étudiant de façon sécurisée (JWT requis).
    Accessible par : l'étudiant lui-même, entreprises validées, club.
    """
    try:
        uid = uuid.UUID(etudiant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")

    cv = db.query(CV).filter(CV.etudiant_id == uid).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable")

    cv_path = os.path.join(settings.STORAGE_PATH, "cvs", f"{etudiant_id}.pdf")
    if not os.path.exists(cv_path):
        raise HTTPException(status_code=404, detail="Fichier CV introuvable")

    return FileResponse(
        path=cv_path,
        media_type="application/pdf",
        filename=f"cv_{etudiant_id}.pdf",
    )
