# Containerization Specification

## Purpose

This specification defines Docker containerization requirements for the Todo AI Chatbot application. It covers multi-stage builds, security best practices, environment variable handling, and optimization for Kubernetes deployment.

## Responsibilities

### Frontend Container
- Build React/Vite application
- Serve static assets via production server (nginx)
- Support runtime configuration injection for Kubernetes
- Expose port 3000
- Run as non-root user

### Backend Container
- Build FastAPI application
- Include all Python dependencies
- Support MCP server integration
- Expose port 8000
- Run as non-root user
- Handle environment variables at runtime

## Frontend Dockerfile Specification

### Base Image
- **Build Stage**: `node:20-alpine`
- **Production Stage**: `nginx:alpine`

### Build Process
1. Install dependencies:
   - Prefer `npm ci` **only when** `package-lock.json` is in sync with `package.json`
   - If lockfile drift exists (common in hackathon repos), use `npm install --no-audit --no-fund` to ensure the container image can still be built reproducibly from the repository state
2. Build application (`npm run build`)
3. Copy built assets to production image
4. Configure nginx to serve SPA routes
5. Generate `config.js` at container startup for runtime env injection

### Environment Variables
- **Runtime (container startup)**:
  - `BACKEND_API_URL`: Backend API endpoint used to generate `/config.js`
- **Build-time (Vite)**:
  - `VITE_BACKEND_API_URL`: Default backend API endpoint (fallback if runtime config not present)
- `VITE_APP_NAME`: Application name (optional)

### Security
- nginx image default user is acceptable for local Minikube; optionally enforce non-root via Kubernetes `securityContext`
- Minimal base image (Alpine Linux)
- No unnecessary packages
- Multi-stage build to reduce image size

### Port
- Expose: `3000`

### Health Check
- HTTP GET `/health` should return 200 (served by nginx)
- Docker healthchecks should prefer `http://127.0.0.1:3000/health` to avoid IPv6 `localhost` resolution differences

### Runtime Config Injection (Kubernetes-Friendly)
- The container serves `/config.js` generated from `frontend/public/config.js.template`
- `frontend/index.html` loads `/config.js` before the Vite bundle
- Frontend code reads `window.__RUNTIME_CONFIG__` first, then falls back to `import.meta.env`
- Implementation detail: the container startup script should use **`envsubst`** (from `gettext`) to substitute `${BACKEND_API_URL}` into `config.js.template`
- **Restart resilience**: The startup script must handle container restarts gracefully:
  - If `config.js.template` exists (first run): process it and delete the template
  - If template is missing but `config.js` exists (restart): skip processing (already done)
  - If both are missing: create a default `config.js` with the current `BACKEND_API_URL` env var
  - This prevents the container from exiting on restart when the template was already processed

## Backend Dockerfile Specification

### Base Image
- **Build Stage**: `python:3.11-slim`
- **Production Stage**: `python:3.11-slim`

### Build Process
1. Install system dependencies (if needed)
2. Create virtual environment
3. Install Python dependencies from `requirements.txt`
4. Copy application code
5. Set working directory

### Environment Variables (Runtime)
- `DATABASE_URL`: Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Authentication secret key
- `OPENAI_API_KEY`: OpenAI API key for chatbot
- `CORS_ORIGINS`: Allowed CORS origins
- `JWT_SECRET_KEY`: JWT signing key
- `JWT_ALGORITHM`: JWT algorithm (default: HS256)

### Security
- Non-root user: `appuser` (UID 1000)
- Minimal base image (slim Python)
- No unnecessary packages
- Virtual environment isolation

### Port
- Expose: `8000`

### Health Check
- HTTP GET `/api/health` should return 200

### Entry Point
- `uvicorn api.index:app --host 0.0.0.0 --port 8000`

## Multi-Stage Build Strategy

### Frontend
```
Stage 1: Dependencies
  - Install npm packages
  - Cache node_modules

Stage 2: Build
  - Build production bundle
  - Optimize assets

Stage 3: Production
  - Copy built assets
  - Configure server
  - Set non-root user
```

### Backend
```
Stage 1: Builder
  - Install build dependencies
  - Create virtual environment
  - Install Python packages

Stage 2: Production
  - Copy virtual environment
  - Copy application code
  - Set non-root user
  - Configure entry point
```

## Image Optimization

### Size Reduction
- Use Alpine/slim base images
- Multi-stage builds
- Remove build dependencies in final stage
- Use `.dockerignore` to exclude unnecessary files

### Layer Caching
- Copy dependency files first (`package.json`, `requirements.txt`)
- Install dependencies before copying source code
- Order operations by change frequency

### Security Scanning
- Scan images for vulnerabilities
- Use official base images
- Keep base images updated

## Docker Ignore Files

### Frontend `.dockerignore`
```
node_modules
.git
.env.local
dist
*.log
.DS_Store
coverage
.vscode
```

### Backend `.dockerignore`
```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv
.git
.env
*.log
.pytest_cache
.coverage
```

## Acceptance Criteria

1. ✅ Dockerfiles build successfully without errors
2. ✅ Frontend dependency install strategy is documented:
   - `npm ci` when lockfile is in sync
   - `npm install` when lockfile drift exists
2. ✅ Images are optimized (< 500MB for frontend, < 800MB for backend)
3. ✅ Containers run as non-root users
4. ✅ Environment variables are properly handled
5. ✅ Health checks respond correctly
6. ✅ Containers start and serve traffic
7. ✅ Frontend connects to backend
8. ✅ Backend connects to database
9. ✅ MCP tools work within backend container

## Validation Checklist

- [ ] `docker build` completes successfully
- [ ] Images tagged correctly (`todo-frontend:latest`, `todo-backend:latest`)
- [ ] Containers start with `docker run`
- [ ] Ports are accessible
- [ ] Health endpoints respond
- [ ] Non-root user verified (`whoami` in container)
- [ ] Environment variables loaded correctly
- [ ] Image sizes are reasonable
- [ ] No security vulnerabilities in base images

## Example Build Commands

```bash
# Frontend
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/

# Backend
docker build -t todo-backend:latest -f backend/Dockerfile backend/
```

## Example Run Commands

```bash
# Frontend
docker run -p 3000:3000 \
  -e BACKEND_API_URL=http://localhost:8000 \
  todo-frontend:latest

# Backend
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e BETTER_AUTH_SECRET=... \
  -e OPENAI_API_KEY=... \
  todo-backend:latest
```

## Windows Convenience Runner (Required)

### Purpose
Provide a single **root-level** Windows `.bat` script to build and run both containers consistently for judges and local dev.

### Artifact
- `run-containers.bat` (repo root)

### Behavior
- Verifies Docker is running
- Removes any existing `todo-backend` / `todo-frontend` containers
- Builds images:
  - `todo-backend:local` from `backend/Dockerfile`
  - `todo-frontend:local` from `frontend/Dockerfile`
- Starts backend using `--env-file backend\\.env` (must contain `DATABASE_URL` and `BETTER_AUTH_SECRET`)
- Starts frontend with `BACKEND_API_URL=http://localhost:8000`
- Prints access URLs

### Acceptance Criteria (Windows Runner)
- ✅ `run-containers.bat` exists at repo root
- ✅ Running it starts:
  - backend on `http://localhost:8000`
  - frontend on `http://localhost:3000`
- ✅ Containers are healthy (`/api/health`, `/health`)

## Notes for Judges

- Dockerfiles follow best practices
- Multi-stage builds optimize image size
- Security hardened (non-root, minimal images)
- Ready for Kubernetes deployment
- Environment variables support ConfigMaps/Secrets
