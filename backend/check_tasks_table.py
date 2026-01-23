#!/usr/bin/env python3
"""Check and fix tasks table structure"""
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

def check_and_fix_tasks_table():
    """Check tasks table structure and add missing columns"""
    try:
        engine = get_engine()
        inspector = inspect(engine)
        
        # Check if tasks table exists
        if 'tasks' not in inspector.get_table_names():
            print("❌ Tasks table does not exist. Creating it...", file=sys.stderr, flush=True)
            from app.models import Task
            from sqlmodel import SQLModel
            SQLModel.metadata.create_all(engine)
            print("✅ Tasks table created", file=sys.stderr, flush=True)
            return
        
        # Get current columns
        current_columns = {col['name']: col for col in inspector.get_columns('tasks')}
        print(f"Current tasks table columns: {list(current_columns.keys())}", file=sys.stderr, flush=True)
        
        # Required columns from Task model
        required_columns = {
            'id': 'SERIAL PRIMARY KEY',
            'user_id': 'INTEGER NOT NULL',
            'title': 'VARCHAR(255) NOT NULL',
            'description': 'TEXT',
            'priority': "VARCHAR(20) DEFAULT 'medium' NOT NULL",
            'status': "VARCHAR(20) DEFAULT 'pending' NOT NULL",
            'due_date': 'TIMESTAMP',
            'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        }
        
        with Session(engine) as session:
            missing_columns = []
            for col_name, col_def in required_columns.items():
                if col_name not in current_columns:
                    missing_columns.append((col_name, col_def))
                    print(f"⚠️ Missing column: {col_name}", file=sys.stderr, flush=True)
            
            if missing_columns:
                print(f"Adding {len(missing_columns)} missing columns...", file=sys.stderr, flush=True)
                for col_name, col_def in missing_columns:
                    try:
                        # Skip id as it's the primary key (should already exist)
                        if col_name == 'id':
                            continue
                        
                        sql = f"ALTER TABLE tasks ADD COLUMN IF NOT EXISTS {col_name} {col_def}"
                        print(f"  Executing: {sql}", file=sys.stderr, flush=True)
                        session.exec(text(sql))
                        session.commit()
                        print(f"  ✅ Added column: {col_name}", file=sys.stderr, flush=True)
                    except Exception as e:
                        print(f"  ⚠️ Could not add {col_name}: {e}", file=sys.stderr, flush=True)
                        session.rollback()
                        # Try without IF NOT EXISTS for PostgreSQL compatibility
                        try:
                            sql = f"ALTER TABLE tasks ADD COLUMN {col_name} {col_def}"
                            session.exec(text(sql))
                            session.commit()
                            print(f"  ✅ Added column: {col_name} (retry)", file=sys.stderr, flush=True)
                        except Exception as e2:
                            print(f"  ❌ Failed to add {col_name}: {e2}", file=sys.stderr, flush=True)
                            session.rollback()
            else:
                print("✅ All required columns exist in tasks table", file=sys.stderr, flush=True)
            
            # Verify final structure
            final_columns = {col['name']: col for col in inspector.get_columns('tasks')}
            print(f"\nFinal tasks table columns: {list(final_columns.keys())}", file=sys.stderr, flush=True)
            
        print("✅ Tasks table migration completed!", file=sys.stderr, flush=True)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    check_and_fix_tasks_table()
