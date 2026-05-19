"""Helper to create in-app notifications.
Call create_notification() before db.commit() so it's included in the same transaction.
"""
import uuid
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User, RoleEnum


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    titre: str,
    message: str,
) -> None:
    """Add a notification row for user_id. Does NOT commit — caller must commit."""
    n = Notification(user_id=user_id, titre=titre, message=message)
    db.add(n)


def notify_all_club(db: Session, titre: str, message: str) -> None:
    """Notify every club user. Does NOT commit — caller must commit."""
    club_users = db.query(User).filter(User.role == RoleEnum.club).all()
    for u in club_users:
        create_notification(db, u.id, titre, message)
