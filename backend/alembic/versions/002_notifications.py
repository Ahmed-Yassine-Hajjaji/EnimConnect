"""Add notifications table

Revision ID: 002
Revises: 001
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("titre", sa.String(), nullable=False),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("lu", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")
