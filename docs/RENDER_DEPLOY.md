# Deploy on Render with GitHub Container Registry

The GitHub Actions workflow builds and pushes Docker images to **GitHub Container Registry (ghcr.io)** on every push to `main` or `develop`. You can deploy these images on Render.

## Image URLs

After a successful push, images are available at:

- **Backend:** `ghcr.io/<your-github-username>/<repo-name>/todo-backend:latest`
- **Frontend:** `ghcr.io/<your-github-username>/<repo-name>/todo-frontend:latest`

Example: if your repo is `myorg/hackathon-2-phase-5`:
- `ghcr.io/myorg/hackathon-2-phase-5/todo-backend:latest`
- `ghcr.io/myorg/hackathon-2-phase-5/todo-frontend:latest`

## Render setup

### 1. Make package visible (one-time)

In GitHub: **Settings → Actions → General → Workflow permissions** → choose “Read and write permissions”.  
Then for the repo’s **Packages**: open the package → **Package settings** → set visibility to **Public** (or keep Private and use a PAT; see below).

### 2. Create Backend Web Service

1. In [Render Dashboard](https://dashboard.render.com), click **+ New** → **Web Service**.
2. Under **Source**, select **Existing Image**.
3. **Image URL:** `ghcr.io/<your-github-username>/<repo-name>/todo-backend:latest`
4. **Registry:** GitHub Container Registry (or “Docker” and add credentials).
5. **Credentials** (if the image is private):
   - **Username:** your GitHub username
   - **Password:** a [GitHub Personal Access Token](https://github.com/settings/tokens) with scope `read:packages`
6. **Instance type:** Free or paid.
7. **Environment:** Add `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CORS_ORIGINS`, etc. (see `backend/.env.example`).
8. Create the service and note the backend URL (e.g. `https://todo-backend-xxxx.onrender.com`).

### 3. Create Frontend Web Service

1. **+ New** → **Web Service**.
2. **Existing Image:** `ghcr.io/<your-github-username>/<repo-name>/todo-frontend:latest`
3. Same registry/credentials as backend if private.
4. **Environment:** Add `BACKEND_API_URL=https://todo-backend-xxxx.onrender.com` (your backend URL from step 2).
5. Create the service.

### 4. Redeploy when you push

Image-backed services on Render **do not** auto-deploy on git push. After pushing code and once GitHub Actions has pushed new images:

- In Render, open the service → **Manual Deploy** → **Deploy latest image** (or use a tag like `todo-backend:${{ github.sha }}` if you deploy by commit).

To automate: use [Render’s Deploy Hook](https://render.com/docs/deploy-hooks) and call it from GitHub Actions after the images are pushed.
