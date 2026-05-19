"""Rate limiter partagé — clé basée sur l'ID utilisateur JWT (fallback IP)."""
from fastapi import Request
from jose import jwt, JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_user_key(request: Request) -> str:
    """Extrait l'ID utilisateur du JWT pour le rate limiting, sinon utilise l'IP."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        try:
            from app.config import settings
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            sub = payload.get("sub")
            if sub:
                return str(sub)
        except JWTError:
            pass
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_key)
