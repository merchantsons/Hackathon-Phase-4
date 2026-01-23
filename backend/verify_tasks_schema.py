#!/usr/bin/env python3
"""Verify tasks table schema matches Task model"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text, inspect

# Load .env file
BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)

from app.dependencies.database import get_engine
from sqlmodel import Session

def verify_schema():
    """Verify tasks table has all required columns"""
    try:
        engine = get_engine()
        inspector = inspect(engine)
        
        if 'tasks' not in inspector.get_table_names():
            print("❌ Tasks table does not exist!", file=sys.stderr, flush=True)
            return False
        
        # Get all columns
        columns = inspector.get_columns('tasks')
        column_names = [col['name'] for col in columns]
        
        print("Tasks table columns:", column_names, file=sys.stderr, flush=True)
        
        # Required columns from Task model
        required = ['id', 'user_id', 'title', 'description', 'priority', 'status', 'due_date', 'created_at', 'updated_at']
        missing = [col for col in required if col not in column_names]
        
        if missing:
            print(f"❌ Missing required columns: {missing}", file=sys.stderr, flush=True)
            return False
        
        print("✅ All required columns exist", file=sys.stderr, flush=True)
        
        # Check column types and constraints
        with Session(engine) as session:
            for col in columns:
                col_name = col['name']
                col_type = str(col['type'])
                nullable = col['nullable']
                default = col.get('default', None)
                
                print(f"  {col_name}: type={col_type}, nullable={nullable}, default={default}", file=sys.stderr, flush=True)
        
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False

if __name__ == "__main__":
    success = verify_schema()
    sys.exit(0 if success else 1)
