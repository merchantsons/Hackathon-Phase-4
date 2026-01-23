from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import os
import sys
import traceback
from pathlib import Path
from dotenv import load_dotenv

# Load .env file explicitly before importing app.config
BACKEND_DIR = Path(__file__).parent.parent
ENV_FILE = BACKEND_DIR / ".env"
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)
    print(f"✅ Loaded .env from: {ENV_FILE}", file=sys.stderr, flush=True)
else:
    load_dotenv(override=False)
    print(f"⚠️ .env not found at {ENV_FILE}", file=sys.stderr, flush=True)

app = FastAPI(title="Todo API - Phase 4", version="1.0.0")

# CORS Configuration
try:
    from app.config import settings
    cors_origins_str = os.getenv("CORS_ORIGINS") or settings.cors_origins or "http://localhost:5173"

    if cors_origins_str:
        cors_origins_str = cors_origins_str.rstrip("/")

    origins = [origin.strip().rstrip("/") for origin in cors_origins_str.split(",") if origin.strip()]

    is_local_dev = any("localhost" in origin or "127.0.0.1" in origin for origin in origins) or not origins

    if is_local_dev and "*" not in origins:
        localhost_origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ]
        for origin in localhost_origins:
            if origin not in origins:
                origins.append(origin)

    is_vercel = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV")
    
    if not origins:
        if is_vercel:
            print("⚠️ Warning: CORS_ORIGINS not set in production. Allowing all origins.", file=sys.stderr, flush=True)
            origins = ["*"]
        else:
            origins = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

    print(f"✅ CORS origins configured: {origins}", file=sys.stderr, flush=True)
except Exception as e:
    print(f"Warning: CORS config error: {e}", file=sys.stderr, flush=True)
    origins = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

try:
    is_vercel_prod = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV")
    cors_origins = origins
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )
    print(f"✅ CORS middleware added with origins: {cors_origins}", file=sys.stderr, flush=True)
except Exception as e:
    print(f"Warning: CORS middleware error: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)

# Exception handler for HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin", "*")
    allowed_origin = origin if origin in origins else (origins[0] if origins else "*")

    detail = str(exc.detail) if exc.detail else "An error occurred"

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail},
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    origin = request.headers.get("origin", "*")
    allowed_origin = origin if origin in origins else (origins[0] if origins else "*")

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    error_trace = traceback.format_exc()
    print(f"❌ Unhandled exception: {error_msg}", file=sys.stderr, flush=True)
    print(f"Traceback: {error_trace}", file=sys.stderr, flush=True)

    origin = request.headers.get("origin", "*")
    allowed_origin = origin if origin in origins else (origins[0] if origins else "*")

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": error_msg,
            "type": type(exc).__name__
        },
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Todo API is running"}

# Include routers
try:
    from app.routes import health
    app.include_router(health.router, prefix="/api")
    print("✅ Health router loaded", file=sys.stderr, flush=True)
except Exception as e:
    print(f"❌ Error loading health router: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)

try:
    from app.routes import auth
    app.include_router(auth.router)
    print("✅ Auth router loaded", file=sys.stderr, flush=True)
except Exception as e:
    print(f"❌ Error loading auth router: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)

try:
    from app.routes import tasks
    app.include_router(tasks.router)
    print("✅ Tasks router loaded", file=sys.stderr, flush=True)
except Exception as e:
    print(f"❌ Error loading tasks router: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)

# Initialize database tables
try:
    from app.dependencies.database import get_engine
    from app.models import User, Task
    from sqlmodel import SQLModel
    from sqlalchemy import inspect, text
    from sqlmodel import Session
    
    engine = get_engine()
    
    # Check if tables exist, if not create them
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Create tables if they don't exist
    SQLModel.metadata.create_all(engine, checkfirst=True)
    
    # Check and add missing columns for users table
    if 'users' in existing_tables:
        with Session(engine) as session:
            # Check if name column exists
            result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'name'
                """)
            ).first()
            
            if result is None:
                print("⚠️ Adding missing 'name' column to users table...", file=sys.stderr, flush=True)
                try:
                    session.exec(text("ALTER TABLE users ADD COLUMN name VARCHAR(255)"))
                    session.commit()
                    print("✅ Added 'name' column to users table", file=sys.stderr, flush=True)
                except Exception as e:
                    print(f"⚠️ Could not add name column (may already exist): {e}", file=sys.stderr, flush=True)
                    session.rollback()
    
    # Check and add missing columns for tasks table
    if 'tasks' in existing_tables:
        with Session(engine) as session:
            # Get existing columns
            task_columns_result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'tasks'
                """)
            ).all()
            task_column_names = [col[0] if isinstance(col, tuple) else col for col in task_columns_result]
            
            # Required columns from Task model
            required_columns = {
                'priority': "VARCHAR(20) DEFAULT 'medium' NOT NULL",
                'status': "VARCHAR(20) DEFAULT 'pending' NOT NULL",
                'due_date': 'TIMESTAMP',
                'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
            }
            
            missing_columns = [col for col in required_columns.keys() if col not in task_column_names]
            
            if missing_columns:
                print(f"⚠️ Adding missing columns to tasks table: {missing_columns}...", file=sys.stderr, flush=True)
                for col_name in missing_columns:
                    col_def = required_columns[col_name]
                    try:
                        sql = f"ALTER TABLE tasks ADD COLUMN {col_name} {col_def}"
                        session.exec(text(sql))
                        session.commit()
                        print(f"✅ Added column: {col_name}", file=sys.stderr, flush=True)
                    except Exception as e:
                        print(f"⚠️ Could not add {col_name} (may already exist): {e}", file=sys.stderr, flush=True)
                        session.rollback()
            else:
                print("✅ All required columns exist in tasks table", file=sys.stderr, flush=True)
    
    print("✅ Database tables initialized", file=sys.stderr, flush=True)
except Exception as e:
    print(f"⚠️ Warning: Could not initialize database tables: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)

print("✅ App initialization complete", file=sys.stderr, flush=True)
