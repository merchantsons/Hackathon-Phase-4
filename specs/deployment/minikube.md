# Minikube Deployment Specification

## Purpose

This specification defines the Minikube-based local Kubernetes deployment process for the Todo AI Chatbot application. It covers Minikube setup, image loading, Helm installation, and validation procedures for judges.

## Responsibilities

### Minikube Setup
- Create and configure Minikube cluster
- Set resource requirements
- Enable required addons
- Configure Docker environment

### Image Management
- Build Docker images locally
- Load images into Minikube
- Verify image availability

### Deployment Process
- Install Helm charts
- Configure services
- Expose frontend via NodePort
- Validate deployment

### Validation
- Verify all pods running
- Test service connectivity
- Validate application functionality
- Document access URLs

## Minikube Profile Configuration

### Profile Name
- `todo-hackathon` (or default)

## Windows 10/11 Prerequisites (Judges & Local Dev)

### Purpose
Ensure a consistent, reproducible setup on Windows where **Minikube + Helm** are available and Minikube can use the **Docker** driver.

### Required Tools
- **Docker Desktop** (WSL2 backend recommended)
- **Minikube**
- **Helm 3**
- **kubectl** (already present in this repo’s reference environment)
- **winget** (Windows Package Manager; preferred installer)

### Critical Windows Notes
- If `docker version` shows *“failed to connect … dockerDesktopLinuxEngine”*, Docker Desktop is installed but the **daemon is not running**. Start Docker Desktop and wait until it says **“Engine running”**.
- Ensure BIOS virtualization is enabled (Intel VT-x / AMD-V).
- If you use WSL2:
  - Enable WSL2 + Virtual Machine Platform (Windows Features)
  - Docker Desktop: enable **“Use the WSL 2 based engine”**

### Install (Recommended: winget)
Run in **PowerShell**:

```powershell
# Install Minikube
winget install -e --id Kubernetes.minikube

# Install Helm
winget install -e --id Helm.Helm

# (Optional) Install Docker Desktop (if not installed)
# winget install -e --id Docker.DockerDesktop
```

### Verify Install
```powershell
minikube version
helm version
kubectl version --client
docker version
```

### Resource Requirements
- **CPU**: Minimum 2 cores (4 recommended)
- **Memory**: Minimum 4GB (8GB recommended)
- **Disk**: Minimum 20GB

### Start Command
```bash
minikube start \
  --profile=todo-hackathon \
  --cpus=4 \
  --memory=8192 \
  --disk-size=20g \
  --driver=docker
```

### Windows Start Command (PowerShell)
```powershell
minikube start --profile=todo-hackathon --cpus=4 --memory=8192 --disk-size=20g --driver=docker
```

### Verify Cluster
```powershell
kubectl get nodes
kubectl get pods -A
```

### Required Addons
- `ingress` (optional, for Ingress controller)
- `metrics-server` (for resource monitoring)

Enable addons:
```bash
minikube addons enable ingress
minikube addons enable metrics-server
```

## Docker Environment Setup

### Point Docker to Minikube
```bash
eval $(minikube docker-env --profile=todo-hackathon)
```

This allows:
- Building images directly in Minikube's Docker daemon
- Or loading pre-built images into Minikube

### Verify Docker Context
```bash
docker context ls
# Should show minikube context
```

## Image Building and Loading

### Option 1: Build in Minikube Context
```bash
# Set Docker environment
eval $(minikube docker-env --profile=todo-hackathon)

# Build images
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
docker build -t todo-backend:latest -f backend/Dockerfile backend/

# Verify images
docker images | grep todo
```

### Option 2: Build Locally and Load
```bash
# Build locally
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
docker build -t todo-backend:latest -f backend/Dockerfile backend/

# Load into Minikube
minikube image load todo-frontend:latest --profile=todo-hackathon
minikube image load todo-backend:latest --profile=todo-hackathon
```

## Helm Installation

### Prerequisites
- Helm 3.x installed
- Minikube cluster running
- Images loaded into Minikube

### Install Backend First
```bash
helm install todo-backend ./helm/todo-backend \
  --set secrets.databaseUrl="${DATABASE_URL}" \
  --set secrets.betterAuthSecret="${BETTER_AUTH_SECRET}" \
  --set secrets.openaiApiKey="${OPENAI_API_KEY}" \
  --set secrets.jwtSecretKey="${JWT_SECRET_KEY}" \
  --set config.corsOrigins="http://localhost:30000,http://localhost:5173"
```

### Install Frontend
```bash
helm install todo-frontend ./helm/todo-frontend \
  --set config.backendApiUrl="http://todo-backend:8000"
```

### Verify Installation
```bash
helm list
kubectl get pods
kubectl get services
```

## Accessing the Application

### Get NodePort
```bash
# Get frontend NodePort
kubectl get svc todo-frontend -o jsonpath='{.spec.ports[0].nodePort}'

# Get Minikube IP
minikube ip --profile=todo-hackathon

# Access URL
echo "http://$(minikube ip --profile=todo-hackathon):$(kubectl get svc todo-frontend -o jsonpath='{.spec.ports[0].nodePort}')"
```

### Port Forwarding (Alternative)
```bash
# Frontend
kubectl port-forward svc/todo-frontend 3000:3000

# Backend (for testing)
kubectl port-forward svc/todo-backend 8000:8000
```

## Validation Steps

### 1. Check Pod Status
```bash
kubectl get pods -l app=todo-frontend
kubectl get pods -l app=todo-backend

# All pods should be Running
kubectl get pods
```

### 2. Check Services
```bash
kubectl get svc
# Frontend should have NodePort
# Backend should have ClusterIP
```

### 3. Check Logs
```bash
# Frontend logs
kubectl logs -l app=todo-frontend --tail=50

# Backend logs
kubectl logs -l app=todo-backend --tail=50
```

### 4. Test Health Endpoints
```bash
# Backend health
kubectl exec -it $(kubectl get pod -l app=todo-backend -o jsonpath='{.items[0].metadata.name}') -- \
  curl http://localhost:8000/api/health

# Frontend (via port-forward)
kubectl port-forward svc/todo-frontend 3000:3000 &
curl http://localhost:3000
```

### 5. Test Application Flow
1. Access frontend via NodePort URL
2. Create a user account
3. Create a task via UI
4. Test chatbot functionality
5. Verify MCP tools execute correctly

## Troubleshooting

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Common issues:
# - Image pull errors (verify image loaded)
# - ConfigMap/Secret missing
# - Resource limits too low
```

### Service Not Accessible
```bash
# Verify service endpoints
kubectl get endpoints

# Test service from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://todo-backend:8000/api/health
```

### Database Connection Issues
```bash
# Check backend logs for DB errors
kubectl logs -l app=todo-backend | grep -i database

# Verify DATABASE_URL in secret
kubectl get secret todo-backend -o jsonpath='{.data.databaseUrl}' | base64 -d
```

## One-Command Deployment Script

Create `scripts/deploy-minikube.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting Minikube deployment..."

# Start Minikube
minikube start --profile=todo-hackathon --cpus=4 --memory=8192 || true

# Set Docker environment
eval $(minikube docker-env --profile=todo-hackathon)

# Build images
echo "📦 Building Docker images..."
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
docker build -t todo-backend:latest -f backend/Dockerfile backend/

# Install Helm charts
echo "📊 Installing Helm charts..."
helm upgrade --install todo-backend ./helm/todo-backend \
  --set secrets.databaseUrl="${DATABASE_URL}" \
  --set secrets.betterAuthSecret="${BETTER_AUTH_SECRET}" \
  --set secrets.openaiApiKey="${OPENAI_API_KEY}" \
  --set secrets.jwtSecretKey="${JWT_SECRET_KEY}"

helm upgrade --install todo-frontend ./helm/todo-frontend

# Wait for pods
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=todo-backend --timeout=300s
kubectl wait --for=condition=ready pod -l app=todo-frontend --timeout=300s

# Get access URL
NODE_IP=$(minikube ip --profile=todo-hackathon)
NODE_PORT=$(kubectl get svc todo-frontend -o jsonpath='{.spec.ports[0].nodePort}')

echo "✅ Deployment complete!"
echo "🌐 Frontend URL: http://${NODE_IP}:${NODE_PORT}"
```

## Optional: One-Command Windows Prereq Installer Script

Create `scripts/install-k8s-windows.ps1` (uses `winget`):
```powershell
# Installs Minikube + Helm, and verifies tools.
# Run in an elevated PowerShell if required by your machine policy.

winget install -e --id Kubernetes.minikube
winget install -e --id Helm.Helm

minikube version
helm version
kubectl version --client
docker version
```

## Acceptance Criteria

1. ✅ Minikube cluster starts successfully
2. ✅ Docker images build and load correctly
3. ✅ Helm charts install without errors
4. ✅ All pods reach Running state
5. ✅ Services are accessible
6. ✅ Frontend UI loads correctly
7. ✅ Backend API responds
8. ✅ Database connection works
9. ✅ Chatbot functionality works
10. ✅ MCP tools execute correctly

## Validation Checklist

- [ ] Minikube cluster running
- [ ] Images available in Minikube
- [ ] Helm charts installed
- [ ] All pods in Running state
- [ ] Services have valid endpoints
- [ ] Frontend accessible via NodePort
- [ ] Backend health endpoint responds
- [ ] Application creates/reads/updates/deletes tasks
- [ ] Chatbot can manage tasks via MCP
- [ ] Logs show no critical errors

## Notes for Judges

### Quick Start
1. Ensure Minikube and Helm installed
2. Set environment variables (DATABASE_URL, etc.)
3. Run deployment script
4. Access application via provided URL

### Resource Requirements
- 4 CPU cores
- 8GB RAM
- 20GB disk space

### Access Information
- Frontend: `http://<minikube-ip>:<nodeport>`
- Backend: Internal service at `http://todo-backend:8000`
- Health: `http://<minikube-ip>:<nodeport>/api/health` (via port-forward)

### Cleanup
```bash
helm uninstall todo-frontend todo-backend
minikube stop --profile=todo-hackathon
minikube delete --profile=todo-hackathon
```
