import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Candidature(Base):
    __tablename__ = "candidatures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    etudiant_id = Column(UUID(as_uuid=True), ForeignKey("etudiants.id"), nullable=False)
    annonce_id = Column(UUID(as_uuid=True), ForeignKey("annonces.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("etudiant_id", "annonce_id", name="uq_candidature"),
    )

    etudiant = relationship("Etudiant", back_populates="candidatures")
    annonce = relationship("Annonce", back_populates="candidatures")
