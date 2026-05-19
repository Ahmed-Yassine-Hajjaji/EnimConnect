from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, field_serializer
from app.models.etudiant import NiveauEnum


class EtudiantUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    filiere: Optional[str] = None
    departement: Optional[str] = None
    niveau: Optional[NiveauEnum] = None
    competences: Optional[List[str]] = None
    langues: Optional[List[str]] = None


class EtudiantOut(BaseModel):
    id: UUID
    nom: str
    prenom: str
    telephone: Optional[str] = None
    photo_url: Optional[str] = None
    filiere: Optional[str] = None
    departement: Optional[str] = None
    niveau: Optional[NiveauEnum] = None
    competences: List[str] = []
    langues: List[str] = []
    email: Optional[str] = None

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True


class CVOut(BaseModel):
    id: UUID
    fichier_url: str
    description_ia: Optional[str] = None
    consentement_ia: bool = True
    uploaded_at: datetime

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True
