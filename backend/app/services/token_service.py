"""HMAC-SHA256 signed tokens for email validation links (48h expiry)."""
import hmac
import hashlib
import time
from app.config import settings

EXPIRY_SECONDS = 48 * 3600


def _sign(payload: str) -> str:
    return hmac.new(
        settings.HMAC_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()


# ── Legacy tokens (annonce-level) ──────────────────────────────────────────────

def generate_validation_token(annonce_id: str, chef_id: str) -> str:
    ts = int(time.time())
    payload = f"{annonce_id}:{chef_id}:{ts}"
    sig = _sign(payload)
    return f"{ts}:{sig}"


def verify_validation_token(token: str, annonce_id: str, chef_id: str) -> bool:
    try:
        ts_str, sig = token.split(":", 1)
        ts = int(ts_str)
    except ValueError:
        return False
    if time.time() - ts > EXPIRY_SECONDS:
        return False
    payload = f"{annonce_id}:{chef_id}:{ts}"
    expected = _sign(payload)
    return hmac.compare_digest(expected, sig)


# ── Per-department validation tokens ───────────────────────────────────────────

def generate_validation_token_dept(validation_dept_id: str, chef_id: str) -> str:
    """Token HMAC pour valider/rejeter une offre pour un département précis."""
    ts = int(time.time())
    payload = f"dept:{validation_dept_id}:{chef_id}:{ts}"
    sig = _sign(payload)
    return f"{ts}:{sig}"


def verify_validation_token_dept(token: str, validation_dept_id: str, chef_id: str) -> bool:
    try:
        ts_str, sig = token.split(":", 1)
        ts = int(ts_str)
    except ValueError:
        return False
    if time.time() - ts > EXPIRY_SECONDS:
        return False
    payload = f"dept:{validation_dept_id}:{chef_id}:{ts}"
    expected = _sign(payload)
    return hmac.compare_digest(expected, sig)
