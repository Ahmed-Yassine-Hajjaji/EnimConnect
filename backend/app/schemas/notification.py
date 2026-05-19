from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    titre: str
    message: str
    lu: bool
    created_at: datetime

    model_config = {"from_attributes": True}
