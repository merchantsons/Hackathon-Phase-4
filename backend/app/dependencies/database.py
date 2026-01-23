from sqlmodel import Session, create_engine
from app.config import settings
import os
import sys

# Create engine lazily to avoid connection errors at import time
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        # Get DATABASE_URL from settings (which reads from .env file or environment variables)
        try:
            db_url = os.getenv("DATABASE_URL") or (settings.database_url if settings else "")
        except Exception as e:
            print(f"⚠️ Error reading settings: {e}", file=sys.stderr, flush=True)
            db_url = os.getenv("DATABASE_URL", "")

        if not db_url:
            error_msg = "DATABASE_URL environment variable is not set"
            print(f"❌ {error_msg}", file=sys.stderr, flush=True)
            print(f"   Checked os.getenv('DATABASE_URL'): {os.getenv('DATABASE_URL')}", file=sys.stderr, flush=True)
            if settings:
                print(f"   Checked settings.database_url: {settings.database_url}", file=sys.stderr, flush=True)
            raise ValueError(error_msg)

        # Enforce PostgreSQL only - no SQLite support
        if not db_url.startswith(("postgresql://", "postgres://")):
            error_msg = f"Only PostgreSQL databases are supported. Current DATABASE_URL starts with: {db_url[:20]}..."
            print(f"❌ {error_msg}", file=sys.stderr, flush=True)
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string (postgresql://...)")

        try:
            # For serverless, use connection pooling with appropriate settings
            _engine = create_engine(
                db_url,
                echo=False,
                pool_pre_ping=True,
                pool_size=1,
                max_overflow=0,
                pool_recycle=300,  # Recycle connections after 5 minutes
                connect_args={
                    "connect_timeout": 10,  # 10 second connection timeout
                    "sslmode": "require"
                }
            )
            print("✅ Database engine created", file=sys.stderr, flush=True)
        except Exception as e:
            error_msg = f"Failed to create database engine: {str(e)}"
            print(f"❌ {error_msg}", file=sys.stderr, flush=True)
            raise

    return _engine

def get_db_session():
    """Get database session with error handling for PostgreSQL database

    Routes should explicitly call session.commit() to save changes.
    This function ensures proper rollback on errors and session cleanup.
    """
    engine = get_engine()
    session = Session(engine)
    try:
        yield session
    except Exception as e:
        # Rollback on any error to ensure data consistency
        try:
            session.rollback()
        except Exception:
            pass  # Ignore rollback errors if session is already closed
        error_msg = f"Database session error: {str(e)}"
        print(f"❌ {error_msg}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        # Re-raise to let FastAPI handle it properly
        raise
    finally:
        # Always close the session to release connection back to pool
        try:
            session.close()
        except Exception:
            pass  # Ignore close errors
