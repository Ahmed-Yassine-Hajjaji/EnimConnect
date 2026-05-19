"""Initial schema — all tables

Revision ID: 001
Revises:
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # users
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("email", sa.String, nullable=False, unique=True),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column(
            "role",
            sa.Enum("etudiant", "entreprise", "club", name="roleenum"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # chefs_departement
    op.create_table(
        "chefs_departement",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("nom", sa.String, nullable=False),
        sa.Column("email", sa.String, nullable=False, unique=True),
        sa.Column("departement", sa.String, nullable=False),
    )

    # etudiants
    op.create_table(
        "etudiants",
        sa.Column("id", UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("nom", sa.String, nullable=False),
        sa.Column("prenom", sa.String, nullable=False),
        sa.Column("telephone", sa.String),
        sa.Column("photo_url", sa.String),
        sa.Column("filiere", sa.String),
        sa.Column("departement", sa.String),
        sa.Column(
            "niveau",
            sa.Enum("1A", "2A", "3A", name="niveauenum"),
            nullable=True,
        ),
        sa.Column("competences", sa.ARRAY(sa.String), default=[]),
        sa.Column("langues", sa.ARRAY(sa.String), default=[]),
    )

    # entreprises
    op.create_table(
        "entreprises",
        sa.Column("id", UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("nom_entreprise", sa.String, nullable=False),
        sa.Column("secteur", sa.String),
        sa.Column("ville", sa.String),
        sa.Column("valide", sa.Boolean, default=False, nullable=False),
        sa.Column("valide_par", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("valide_le", sa.DateTime, nullable=True),
    )

    # annonces
    op.create_table(
        "annonces",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("entreprise_id", UUID(as_uuid=True), sa.ForeignKey("entreprises.id"), nullable=False),
        sa.Column("titre", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("departement", sa.String, nullable=False),
        sa.Column("duree_mois", sa.Integer),
        sa.Column(
            "statut",
            sa.Enum("en_attente", "validee", "rejetee", name="statutannonce"),
            default="en_attente",
            nullable=False,
        ),
        sa.Column("motif", sa.Text, nullable=True),
        sa.Column("validee_par", UUID(as_uuid=True), sa.ForeignKey("chefs_departement.id"), nullable=True),
        sa.Column("validee_le", sa.DateTime, nullable=True),
        sa.Column("is_active", sa.Boolean, default=False, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # candidatures
    op.create_table(
        "candidatures",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("etudiant_id", UUID(as_uuid=True), sa.ForeignKey("etudiants.id"), nullable=False),
        sa.Column("annonce_id", UUID(as_uuid=True), sa.ForeignKey("annonces.id"), nullable=False),
        sa.Column("date", sa.DateTime, nullable=False),
        sa.UniqueConstraint("etudiant_id", "annonce_id", name="uq_candidature"),
    )

    # cvs
    op.create_table(
        "cvs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("etudiant_id", UUID(as_uuid=True), sa.ForeignKey("etudiants.id"), nullable=False, unique=True),
        sa.Column("fichier_url", sa.String, nullable=False),
        sa.Column("description_ia", sa.Text, nullable=True),
        sa.Column("uploaded_at", sa.DateTime, nullable=False),
    )

    # embeddings (uses pgvector VECTOR type)
    op.execute("""
        CREATE TABLE embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_type VARCHAR NOT NULL,
            source_id UUID NOT NULL,
            vecteur VECTOR(1536) NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_embeddings_source_id ON embeddings (source_id)")


def downgrade() -> None:
    op.drop_table("embeddings")
    op.drop_table("cvs")
    op.drop_table("candidatures")
    op.drop_table("annonces")
    op.drop_table("entreprises")
    op.drop_table("etudiants")
    op.drop_table("chefs_departement")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS statutannonce")
    op.execute("DROP TYPE IF EXISTS niveauenum")
    op.execute("DROP TYPE IF EXISTS roleenum")
    op.execute("DROP EXTENSION IF EXISTS vector")
