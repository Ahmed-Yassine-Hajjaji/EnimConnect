import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        NotificationOut(
            id=str(n.id),
            titre=n.titre,
            message=n.message,
            lu=n.lu,
            created_at=n.created_at,
        )
        for n in notifications
    ]


@router.get("/non-lues", response_model=int)
def count_non_lues(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.lu == False)
        .count()
    )


@router.post("/{notification_id}/lire")
def marquer_lue(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = (
        db.query(Notification)
        .filter(
            Notification.id == uuid.UUID(notification_id),
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    n.lu = True
    db.commit()
    return {"ok": True}


@router.post("/lire-tout")
def marquer_tout_lu(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.lu == False,
    ).update({"lu": True})
    db.commit()
    return {"ok": True}


@router.delete("/{notification_id}")
def supprimer(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = (
        db.query(Notification)
        .filter(
            Notification.id == uuid.UUID(notification_id),
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    db.delete(n)
    db.commit()
    return {"ok": True}
