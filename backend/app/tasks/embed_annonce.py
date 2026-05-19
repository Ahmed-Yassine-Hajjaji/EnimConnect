"""Background task: generate and store embedding for a validated annonce."""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.annonce import Annonce
from app.models.embedding import Embedding, SourceType
from app.services.embedding_service import generate_embedding


def embed_annonce_background(annonce_id: str) -> None:
    db: Session = SessionLocal()
    try:
        annonce = db.query(Annonce).filter(Annonce.id == uuid.UUID(annonce_id)).first()
        if not annonce:
            return

        text = f"{annonce.titre}\n{annonce.description}"
        vector = generate_embedding(text)

        existing = (
            db.query(Embedding)
            .filter(
                Embedding.source_type == SourceType.annonce,
                Embedding.source_id == annonce.id,
            )
            .first()
        )
        if existing:
            existing.vecteur = vector
            existing.updated_at = datetime.utcnow()
            db.add(existing)
        else:
            emb = Embedding(
                source_type=SourceType.annonce,
                source_id=annonce.id,
                vecteur=vector,
            )
            db.add(emb)

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
