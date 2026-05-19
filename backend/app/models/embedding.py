import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.database import Base
import enum


class SourceType(str, enum.Enum):
    cv = "cv"
    annonce = "annonce"


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(Enum(SourceType), nullable=False)
    source_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    vecteur = Column(Vector(1536), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
