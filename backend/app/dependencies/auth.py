from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

# Read secret from environment or settings
def get_auth_secret():
    # Try environment variable first (for Vercel)
    secret = os.getenv("BETTER_AUTH_SECRET")
    if secret:
        return secret

    # Fall back to settings (reads from .env file)
    try:
        from app.config import settings
        if settings.better_auth_secret:
            return settings.better_auth_secret
    except Exception:
        pass

    return ""

security = HTTPBearer()

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """Validates JWT and extracts user_id"""
    token = credentials.credentials
    secret = get_auth_secret()

    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: BETTER_AUTH_SECRET not set"
        )

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"]
        )
        user_id: int = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user_id claim"
            )

        return user_id

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
