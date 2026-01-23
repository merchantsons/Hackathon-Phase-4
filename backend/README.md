# Todo API Backend - Phase 4

FastAPI backend with Neon PostgreSQL database integration.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-secret-key-here
CORS_ORIGINS=http://localhost:5173
```

## Running Locally

### Option 1: Using the run script (Recommended)
```bash
cd backend
python run.py
```

### Option 2: Using uvicorn directly
```bash
cd backend
uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

**Note**: Make sure you're in the `backend` directory when running the server, so the `.env` file is found correctly.

## Database Setup

The backend uses SQLModel with Neon PostgreSQL. Tables are automatically created on first run.

### Models

- **User**: id, email, password_hash, name, created_at
- **Task**: id, user_id, title, description, priority, status, due_date, created_at, updated_at

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Tasks
- `GET /api/tasks` - List all tasks (requires auth)
- `POST /api/tasks` - Create a new task (requires auth)
- `GET /api/tasks/{task_id}` - Get a single task (requires auth)
- `PUT /api/tasks/{task_id}` - Update a task (requires auth)
- `DELETE /api/tasks/{task_id}` - Delete a task (requires auth)
- `PATCH /api/tasks/{task_id}/complete` - Mark task as completed (requires auth)

## Deployment

For Vercel deployment, create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```
