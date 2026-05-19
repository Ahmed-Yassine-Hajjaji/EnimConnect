from pydantic import BaseModel, EmailStr
from app.models.user import RoleEnum


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    role: RoleEnum
    is_active: bool

    class Config:
        from_attributes = True
