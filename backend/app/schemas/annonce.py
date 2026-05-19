from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, field_serializer
from app.models.annonce import StatutAnnonce
from app.models.annonce_validation_dept import StatutValidationDept


class ValidationDeptOut(BaseModel):
    """Statut de validation pour un département donné."""
    departement: str
    statut: StatutValidationDept
    motif: Optional[str] = None
    validated_at: Optional[datetime] = None
    chef_nom: Optional[str] = None

    class Config:
        from_attributes = True


class AnnonceCreate(BaseModel):
    titre: str
    description: str
    departement: str              # Département principal (affichage)
    departements: List[str]       # Tous les depts ciblés (au moins un)
    duree_mois: Optional[int] = None


class AnnonceUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    departement: Optional[str] = None
    duree_mois: Optional[int] = None


class AnnonceOut(BaseModel):
    id: UUID
    entreprise_id: UUID
    titre: str
    description: str
    departement: str
    departements: Optional[List[str]] = None
    duree_mois: Optional[int] = None
    statut: StatutAnnonce
    is_active: bool
    created_at: datetime
    nom_entreprise: Optional[str] = None
    ville: Optional[str] = None

    @field_serializer("id", "entreprise_id")
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True


class AnnonceDetail(AnnonceOut):
    motif: Optional[str] = None
    validations_dept: Optional[List[ValidationDeptOut]] = None
