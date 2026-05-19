import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class CV(Base):
    __tablename__ = "cvs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    etudiant_id = Column(UUID(as_uuid=True), ForeignKey("etudiants.id"), nullable=False, unique=True)
    fichier_url = Column(String, nullable=False)
    description_ia = Column(Text, nullable=True)
    consentement_ia = Column(Boolean, nullable=False, server_default="true", default=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    etudiant = relationship("Etudiant", back_populates="cv")
