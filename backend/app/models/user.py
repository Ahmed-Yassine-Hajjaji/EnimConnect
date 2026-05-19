import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class RoleEnum(str, enum.Enum):
    etudiant = "etudiant"
    entreprise = "entreprise"
    club = "club"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    etudiant = relationship("Etudiant", back_populates="user", uselist=False)
    entreprise = relationship("Entreprise", back_populates="user", uselist=False, foreign_keys="Entreprise.id")
