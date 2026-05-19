from typing import Optional
from uuid import UUID
from pydantic import BaseModel, field_serializer


class EntrepriseUpdate(BaseModel):
    nom_entreprise: Optional[str] = None
    secteur: Optional[str] = None
    ville: Optional[str] = None


class EntrepriseOut(BaseModel):
    id: UUID
    nom_entreprise: str
    secteur: Optional[str] = None
    ville: Optional[str] = None
    valide: bool
    email: Optional[str] = None

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True


class EntrepriseListItem(BaseModel):
    id: UUID
    nom_entreprise: str
    secteur: Optional[str] = None
    ville: Optional[str] = None
    valide: bool
    email: str

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True
