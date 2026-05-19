import uuid
from sqlalchemy import Column, String, Enum, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class NiveauEnum(str, enum.Enum):
    un_a = "1A"
    deux_a = "2A"
    trois_a = "3A"


class Etudiant(Base):
    __tablename__ = "etudiants"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    telephone = Column(String)
    photo_url = Column(String)
    filiere = Column(String)
    departement = Column(String)
    niveau = Column(Enum(NiveauEnum, values_callable=lambda e: [x.value for x in e]))
    competences = Column(ARRAY(String), default=[])
    langues = Column(ARRAY(String), default=[])

    user = relationship("User", back_populates="etudiant")
    cv = relationship("CV", back_populates="etudiant", uselist=False)
    candidatures = relationship("Candidature", back_populates="etudiant")
