from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Get the root directory (parent of app directory)
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"

# Explicitly load .env file before settings initialization
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)
    print(f"✅ Loaded .env file from: {ENV_FILE}", file=sys.stderr, flush=True)
else:
    # Try loading from current directory as fallback
    load_dotenv(override=False)
    print(f"⚠️ .env file not found at {ENV_FILE}, trying current directory", file=sys.stderr, flush=True)

class Settings(BaseSettings):
    # Make database_url optional to avoid initialization errors
    database_url: str = ""
    better_auth_secret: str = ""
    cors_origins: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True
    )

# Initialize settings
try:
    settings = Settings()

    # Remove trailing slash from CORS_ORIGINS if present
    if settings.cors_origins and settings.cors_origins.endswith("/"):
        settings.cors_origins = settings.cors_origins.rstrip("/")

    print(f"✅ Settings initialized", file=sys.stderr, flush=True)
    print(f"   DATABASE_URL: {'set' if settings.database_url else 'missing'}", file=sys.stderr, flush=True)
    print(f"   BETTER_AUTH_SECRET: {'set' if settings.better_auth_secret else 'missing'}", file=sys.stderr, flush=True)
    print(f"   CORS_ORIGINS: {settings.cors_origins or 'not set'}", file=sys.stderr, flush=True)

except Exception as e:
    print(f"⚠️ Warning: Settings initialization failed: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)

    # Create a minimal settings object with fallback
    cors_origins = os.getenv("CORS_ORIGINS", "").rstrip("/")
    settings = Settings(
        database_url=os.getenv("DATABASE_URL", ""),
        better_auth_secret=os.getenv("BETTER_AUTH_SECRET", ""),
        cors_origins=cors_origins
    )
