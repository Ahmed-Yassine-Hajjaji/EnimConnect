"""Add departements array to annonces + create annonce_validations_dept table

Revision ID: 003
Revises: 002
Create Date: 2026-05-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add departements column to annonces
    op.add_column(
        "annonces",
        sa.Column("departements", ARRAY(sa.String()), nullable=True),
    )

    # Backfill: copy departement -> departements for existing rows
    op.execute("UPDATE annonces SET departements = ARRAY[departement] WHERE departements IS NULL")

    # Create annonce_validations_dept table
    op.create_table(
        "annonce_validations_dept",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "annonce_id",
            UUID(as_uuid=True),
            sa.ForeignKey("annonces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("departement", sa.String(), nullable=False),
        sa.Column(
            "statut",
            sa.Enum("en_attente", "validee", "rejetee", name="statutvalidationdept"),
            nullable=False,
            server_default="en_attente",
        ),
        sa.Column("motif", sa.Text(), nullable=True),
        sa.Column("chef_id", UUID(as_uuid=True), sa.ForeignKey("chefs_departement.id"), nullable=True),
        sa.Column("validated_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_annonce_validations_dept_annonce_id", "annonce_validations_dept", ["annonce_id"])


def downgrade() -> None:
    op.drop_index("ix_annonce_validations_dept_annonce_id", table_name="annonce_validations_dept")
    op.drop_table("annonce_validations_dept")
    op.execute("DROP TYPE IF EXISTS statutvalidationdept")
    op.drop_column("annonces", "departements")
