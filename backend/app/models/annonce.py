import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class StatutAnnonce(str, enum.Enum):
    en_attente = "en_attente"
    validee = "validee"
    rejetee = "rejetee"


class Annonce(Base):
    __tablename__ = "annonces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entreprise_id = Column(UUID(as_uuid=True), ForeignKey("entreprises.id"), nullable=False)
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    departement = Column(String, nullable=False)  # Département principal (affichage)
    departements = Column(ARRAY(String), nullable=True)  # Tous les depts ciblés
    duree_mois = Column(Integer)
    statut = Column(Enum(StatutAnnonce), default=StatutAnnonce.en_attente, nullable=False)
    motif = Column(Text, nullable=True)
    validee_par = Column(UUID(as_uuid=True), ForeignKey("chefs_departement.id"), nullable=True)
    validee_le = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    entreprise = relationship("Entreprise", back_populates="annonces")
    candidatures = relationship("Candidature", back_populates="annonce")
    chef_valideur = relationship("ChefDepartement", foreign_keys=[validee_par])
    validations_dept = relationship(
        "AnnonceValidationDept",
        back_populates="annonce",
        cascade="all, delete-orphan",
    )
