#!/usr/bin/env python3
"""
Run script for the FastAPI backend.
This ensures .env file is loaded before starting the server.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Get the backend directory (where this script is located)
BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"

# Load .env file explicitly
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)
    print(f"✅ Loaded .env file from: {ENV_FILE}", file=sys.stderr, flush=True)
else:
    print(f"⚠️ Warning: .env file not found at {ENV_FILE}", file=sys.stderr, flush=True)
    print(f"   Current directory: {os.getcwd()}", file=sys.stderr, flush=True)
    # Try to load from current directory
    load_dotenv(override=False)

# Verify DATABASE_URL is loaded
if not os.getenv("DATABASE_URL"):
    print("❌ ERROR: DATABASE_URL is not set!", file=sys.stderr, flush=True)
    print(f"   Checked .env file at: {ENV_FILE}", file=sys.stderr, flush=True)
    sys.exit(1)

# Change to backend directory to ensure relative imports work
os.chdir(BACKEND_DIR)

# Now import and run uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api.index:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(BACKEND_DIR)],
    )
