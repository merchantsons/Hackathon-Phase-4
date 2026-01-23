# Database Migration Guide

If you encounter errors about missing columns (like `column users.name does not exist`), you need to update your database schema.

## Quick Fix: Run Migration Script

```bash
cd backend
python migrate_db.py
```

This will automatically add any missing columns to your existing tables without losing data.

## Option 2: Recreate Tables (WARNING: Deletes All Data!)

If you want to start fresh and don't mind losing existing data:

```bash
cd backend
python migrate_db.py --recreate
```

This will drop all tables and recreate them with the correct schema.

## Manual Fix: Add Column via SQL

If you prefer to do it manually, connect to your Neon database and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
```

## What the Migration Does

The migration script:
1. Checks if the `name` column exists in the `users` table
2. Adds it if missing
3. Checks if required columns exist in the `tasks` table (priority, status, due_date)
4. Adds any missing columns

## After Migration

After running the migration, restart your backend server:

```bash
cd backend
python run.py
```

Your registration and login should now work correctly!
