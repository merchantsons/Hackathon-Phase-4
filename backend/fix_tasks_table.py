#!/usr/bin/env python3
"""Fix tasks table to ensure all required fields work correctly"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text

# Load .env file
BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)

from app.dependencies.database import get_engine
from sqlmodel import Session

def fix_tasks_table():
    """Fix tasks table constraints and defaults"""
    try:
        engine = get_engine()
        
        with Session(engine) as session:
            # Make sure priority has default and is not null
            try:
                session.exec(text("""
                    ALTER TABLE tasks 
                    ALTER COLUMN priority SET DEFAULT 'medium',
                    ALTER COLUMN priority SET NOT NULL
                """))
                session.commit()
                print("✅ Fixed priority column constraints", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"⚠️ Priority column: {e}", file=sys.stderr, flush=True)
                session.rollback()
            
            # Make sure status has default and is not null
            try:
                session.exec(text("""
                    ALTER TABLE tasks 
                    ALTER COLUMN status SET DEFAULT 'pending',
                    ALTER COLUMN status SET NOT NULL
                """))
                session.commit()
                print("✅ Fixed status column constraints", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"⚠️ Status column: {e}", file=sys.stderr, flush=True)
                session.rollback()
            
            # Make sure updated_at has default
            try:
                session.exec(text("""
                    ALTER TABLE tasks 
                    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP
                """))
                session.commit()
                print("✅ Fixed updated_at column default", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"⚠️ Updated_at column: {e}", file=sys.stderr, flush=True)
                session.rollback()
            
            # Fix completed column to allow NULL (since we use status instead)
            try:
                session.exec(text("""
                    ALTER TABLE tasks 
                    ALTER COLUMN completed DROP NOT NULL,
                    ALTER COLUMN completed SET DEFAULT NULL
                """))
                session.commit()
                print("✅ Fixed completed column to allow NULL", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"⚠️ Completed column: {e}", file=sys.stderr, flush=True)
                session.rollback()
            
            # Update any existing rows that might have NULL priority or status
            try:
                session.exec(text("""
                    UPDATE tasks 
                    SET priority = 'medium' 
                    WHERE priority IS NULL
                """))
                session.exec(text("""
                    UPDATE tasks 
                    SET status = 'pending' 
                    WHERE status IS NULL
                """))
                session.commit()
                print("✅ Updated existing rows with defaults", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"⚠️ Update existing rows: {e}", file=sys.stderr, flush=True)
                session.rollback()
        
        print("✅ Tasks table fixes completed!", file=sys.stderr, flush=True)
        
    except Exception as e:
        print(f"❌ Fix failed: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    fix_tasks_table()
