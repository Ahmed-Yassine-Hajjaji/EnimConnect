import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Entreprise(Base):
    __tablename__ = "entreprises"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    nom_entreprise = Column(String, nullable=False)
    secteur = Column(String)
    ville = Column(String)
    valide = Column(Boolean, default=False, nullable=False)
    valide_par = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    valide_le = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="entreprise", foreign_keys=[id])
    annonces = relationship("Annonce", back_populates="entreprise")
