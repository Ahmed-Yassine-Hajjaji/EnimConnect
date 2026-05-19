"""Validation par département d'une annonce — un enregistrement par (annonce, département)."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class StatutValidationDept(str, enum.Enum):
    en_attente = "en_attente"
    validee = "validee"
    rejetee = "rejetee"


class AnnonceValidationDept(Base):
    """Un enregistrement = validation d'une annonce pour UN département spécifique.

    - Créé automatiquement lors de la soumission d'une offre (un par département ciblé).
    - Le chef de ce département reçoit un email avec les liens valider/refuser.
    - Les étudiants d'un département voient l'offre seulement quand statut == 'validee'
      pour leur département.
    """
    __tablename__ = "annonce_validations_dept"
    __table_args__ = (
        UniqueConstraint("annonce_id", "departement", name="uq_validation_annonce_dept"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    annonce_id = Column(UUID(as_uuid=True), ForeignKey("annonces.id", ondelete="CASCADE"), nullable=False)
    departement = Column(String, nullable=False)  # Nom du département ENSMR ciblé

    statut = Column(
        Enum(StatutValidationDept, values_callable=lambda e: [x.value for x in e]),
        default=StatutValidationDept.en_attente,
        nullable=False,
    )
    motif = Column(Text, nullable=True)  # Motif de rejet (renseigné par le chef)

    chef_id = Column(UUID(as_uuid=True), ForeignKey("chefs_departement.id"), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    annonce = relationship("Annonce", back_populates="validations_dept")
    chef = relationship("ChefDepartement", foreign_keys=[chef_id])
