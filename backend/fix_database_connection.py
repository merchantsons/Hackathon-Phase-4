#!/usr/bin/env python3
"""
Script to fix database connection issues.
This script will:
1. Check if .env file exists
2. Verify DATABASE_URL is set correctly
3. Test the database connection
4. Fix common connection string issues
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"

def fix_connection_string():
    """Fix common issues with the connection string"""
    if not ENV_FILE.exists():
        print("ERROR: .env file not found!")
        print(f"   Expected location: {ENV_FILE}")
        return False
    
    # Read the .env file
    load_dotenv(dotenv_path=ENV_FILE, override=False)
    db_url = os.getenv("DATABASE_URL", "")
    
    if not db_url:
        print("ERROR: DATABASE_URL not found in .env file!")
        return False
    
    print(f"OK: Found DATABASE_URL in .env file")
    print(f"   Connection string: {db_url[:50]}...")
    
    # Check for common issues
    issues = []
    if "localhost" in db_url.lower() or "127.0.0.1" in db_url:
        issues.append("Connection string points to localhost instead of Neon")
    
    if "channel_binding=require" in db_url:
        issues.append("channel_binding=require may cause connection issues")
    
    if issues:
        print("\nWARNING: Potential issues found:")
        for issue in issues:
            print(f"   - {issue}")
        
        # Fix the connection string
        fixed_url = db_url.replace("&channel_binding=require", "").replace("?channel_binding=require", "")
        if fixed_url != db_url:
            print(f"\nFIXING: Removed channel_binding parameter")
            print(f"   {fixed_url[:80]}...")
            
            # Update .env file
            try:
                with open(ENV_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace the DATABASE_URL line
                lines = content.split('\n')
                new_lines = []
                for line in lines:
                    if line.startswith('DATABASE_URL='):
                        new_lines.append(f'DATABASE_URL={fixed_url}')
                    else:
                        new_lines.append(line)
                
                with open(ENV_FILE, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(new_lines))
                
                print("OK: Updated .env file with fixed connection string")
                return True
            except Exception as e:
                print(f"ERROR: Failed to update .env file: {e}")
                return False
    
    return True

def test_connection():
    """Test the database connection"""
    load_dotenv(dotenv_path=ENV_FILE, override=False)
    db_url = os.getenv("DATABASE_URL", "")
    
    if not db_url:
        print("❌ DATABASE_URL not set")
        return False
    
    try:
        import psycopg2
        print("\nTesting database connection...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"OK: Connection successful!")
        print(f"   PostgreSQL version: {version[:50]}...")
        cursor.close()
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print(f"ERROR: Connection failed: {e}")
        if "Connection refused" in str(e):
            print("\nThis usually means:")
            print("   1. The database server is not running (if using localhost)")
            print("   2. The connection string is incorrect")
            print("   3. Network/firewall issues")
        return False
    except ImportError:
        print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        return False

if __name__ == "__main__":
    # Set UTF-8 encoding for Windows
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    
    print("Checking database connection setup...\n")
    
    # Fix connection string
    if not fix_connection_string():
        sys.exit(1)
    
    # Test connection
    if not test_connection():
        print("\nDatabase connection test failed!")
        print("\nTroubleshooting steps:")
        print("   1. Verify your Neon PostgreSQL connection string is correct")
        print("   2. Check that your Neon database is active")
        print("   3. Ensure you're running the app from the backend directory")
        print("   4. Try running: python run.py")
        sys.exit(1)
    
    print("\nAll checks passed! Your database connection is configured correctly.")
    print("\nTo start the server, run:")
    print("   cd backend")
    print("   python run.py")
