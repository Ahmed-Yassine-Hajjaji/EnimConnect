"""Background task: extract text → GPT description → embedding → save to DB."""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.cv import CV
from app.models.embedding import Embedding, SourceType
from app.services.cv_service import extract_text_from_pdf, generate_cv_description
from app.services.embedding_service import generate_embedding


def analyze_cv_background(cv_id: str) -> None:
    db: Session = SessionLocal()
    try:
        cv = db.query(CV).filter(CV.id == uuid.UUID(cv_id)).first()
        if not cv:
            return

        # Skip OpenAI calls if user did not consent
        if not cv.consentement_ia:
            return

        text = extract_text_from_pdf(cv.fichier_url)
        if not text:
            return

        description = generate_cv_description(text)
        cv.description_ia = description
        db.add(cv)
        db.flush()

        vector = generate_embedding(description or text)

        existing = (
            db.query(Embedding)
            .filter(
                Embedding.source_type == SourceType.cv,
                Embedding.source_id == cv.id,
            )
            .first()
        )
        if existing:
            existing.vecteur = vector
            existing.updated_at = datetime.utcnow()
            db.add(existing)
        else:
            emb = Embedding(
                source_type=SourceType.cv,
                source_id=cv.id,
                vecteur=vector,
            )
            db.add(emb)

        from app.services.notification_service import create_notification
        create_notification(
            db,
            cv.etudiant_id,
            "CV analysé par l'IA",
            "Votre CV a été analysé avec succès. Votre profil est maintenant optimisé pour le matching avec les offres.",
        )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
