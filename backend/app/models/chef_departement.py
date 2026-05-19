import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ChefDepartement(Base):
    __tablename__ = "chefs_departement"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    departement = Column(String, nullable=False)
