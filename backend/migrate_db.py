#!/usr/bin/env python3
"""
Database migration script to add missing columns or recreate tables.
Run this script to update your database schema to match the models.
"""
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
else:
    load_dotenv(override=False)

# Import after loading .env
from app.dependencies.database import get_engine
from app.models import User, Task
from sqlmodel import SQLModel, Session

def migrate_database():
    """Add missing columns to existing tables or recreate tables."""
    try:
        engine = get_engine()
        
        with Session(engine) as session:
            # Check if users table exists and has name column
            result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'name'
                """)
            ).first()
            
            if result is None:
                print("⚠️ 'name' column missing in users table. Adding it...", file=sys.stderr, flush=True)
                # Add name column
                session.exec(
                    text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)")
                )
                session.commit()
                print("✅ Added 'name' column to users table", file=sys.stderr, flush=True)
            else:
                print("✅ 'name' column already exists in users table", file=sys.stderr, flush=True)
            
            # Check if tasks table has all required columns
            task_columns_result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'tasks'
                """)
            ).all()
            
            # Extract column names from tuples
            task_column_names = [col[0] if isinstance(col, tuple) else col for col in task_columns_result]
            print(f"Current tasks columns: {task_column_names}", file=sys.stderr, flush=True)
            
            # Required columns from Task model (excluding id which is primary key)
            required_columns = {
                'priority': "VARCHAR(20) DEFAULT 'medium' NOT NULL",
                'status': "VARCHAR(20) DEFAULT 'pending' NOT NULL",
                'due_date': 'TIMESTAMP',
                'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
            }
            
            missing_columns = []
            for col_name in required_columns.keys():
                if col_name not in task_column_names:
                    missing_columns.append(col_name)
            
            if missing_columns:
                print(f"⚠️ Missing columns in tasks table: {missing_columns}. Adding them...", file=sys.stderr, flush=True)
                for col_name in missing_columns:
                    col_def = required_columns[col_name]
                    try:
                        # Try with IF NOT EXISTS first
                        sql = f"ALTER TABLE tasks ADD COLUMN IF NOT EXISTS {col_name} {col_def}"
                        session.exec(text(sql))
                        print(f"  ✅ Added column: {col_name}", file=sys.stderr, flush=True)
                    except Exception as e:
                        # If IF NOT EXISTS doesn't work, try without it
                        try:
                            sql = f"ALTER TABLE tasks ADD COLUMN {col_name} {col_def}"
                            session.exec(text(sql))
                            print(f"  ✅ Added column: {col_name} (retry)", file=sys.stderr, flush=True)
                        except Exception as e2:
                            print(f"  ⚠️ Could not add {col_name}: {e2}", file=sys.stderr, flush=True)
                
                session.commit()
                print(f"✅ Added missing columns to tasks table: {missing_columns}", file=sys.stderr, flush=True)
            else:
                print("✅ All required columns exist in tasks table", file=sys.stderr, flush=True)
            
            # Ensure priority and status have default values if they exist but don't have defaults
            try:
                # Check if priority has a default
                priority_check = session.exec(
                    text("""
                        SELECT column_default 
                        FROM information_schema.columns 
                        WHERE table_name = 'tasks' AND column_name = 'priority'
                    """)
                ).first()
                
                if not priority_check or priority_check is None:
                    print("⚠️ priority column exists but has no default. Setting default...", file=sys.stderr, flush=True)
                    session.exec(text("ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium'"))
                    session.commit()
                    print("✅ Set default for priority column", file=sys.stderr, flush=True)
                
                # Check if status has a default
                status_check = session.exec(
                    text("""
                        SELECT column_default 
                        FROM information_schema.columns 
                        WHERE table_name = 'tasks' AND column_name = 'status'
                    """)
                ).first()
                
                if not status_check or status_check is None:
                    print("⚠️ status column exists but has no default. Setting default...", file=sys.stderr, flush=True)
                    session.exec(text("ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'pending'"))
                    session.commit()
                    print("✅ Set default for status column", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"⚠️ Could not set defaults: {e}", file=sys.stderr, flush=True)
                session.rollback()
        
        print("✅ Database migration completed successfully!", file=sys.stderr, flush=True)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

def recreate_tables():
    """Drop and recreate all tables (WARNING: This will delete all data!)."""
    try:
        engine = get_engine()
        
        print("⚠️ WARNING: This will delete all existing data!", file=sys.stderr, flush=True)
        response = input("Type 'yes' to continue: ")
        
        if response.lower() != 'yes':
            print("❌ Migration cancelled", file=sys.stderr, flush=True)
            return
        
        # Drop all tables
        SQLModel.metadata.drop_all(engine)
        print("✅ Dropped all tables", file=sys.stderr, flush=True)
        
        # Create all tables
        SQLModel.metadata.create_all(engine)
        print("✅ Created all tables with correct schema", file=sys.stderr, flush=True)
        
        print("✅ Database recreated successfully!", file=sys.stderr, flush=True)
        
    except Exception as e:
        print(f"❌ Recreation failed: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--recreate":
        recreate_tables()
    else:
        migrate_database()
