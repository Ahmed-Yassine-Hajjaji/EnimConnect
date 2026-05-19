from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, field_serializer


class CandidatureOut(BaseModel):
    id: UUID
    etudiant_id: UUID
    annonce_id: UUID
    date: datetime
    titre_annonce: Optional[str] = None
    nom_entreprise: Optional[str] = None

    @field_serializer("id", "etudiant_id", "annonce_id")
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True


class CandidatOut(BaseModel):
    etudiant_id: UUID
    nom: str
    prenom: str
    email: str
    niveau: Optional[str] = None
    filiere: Optional[str] = None
    competences: List[str] = []
    photo_url: Optional[str] = None
    cv_url: Optional[str] = None
    description_cv: Optional[str] = None
    date_candidature: datetime

    @field_serializer("etudiant_id")
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True
