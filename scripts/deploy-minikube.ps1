# Minikube Deployment Script (PowerShell)
# Generated from: specs/deployment/minikube.md

$ErrorActionPreference = "Stop"

$PROFILE = if ($env:MINIKUBE_PROFILE) { $env:MINIKUBE_PROFILE } else { "todo-hackathon" }

Write-Host "🚀 Starting Minikube deployment for Todo AI Chatbot..." -ForegroundColor Cyan

# Check required environment variables
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set!" -ForegroundColor Red
    exit 1
}

if (-not $env:BETTER_AUTH_SECRET) {
    Write-Host "❌ ERROR: BETTER_AUTH_SECRET environment variable is not set!" -ForegroundColor Red
    exit 1
}

if (-not $env:OPENAI_API_KEY) {
    Write-Host "⚠️  WARNING: OPENAI_API_KEY environment variable is not set!" -ForegroundColor Yellow
}

if (-not $env:JWT_SECRET_KEY) {
    Write-Host "⚠️  WARNING: JWT_SECRET_KEY environment variable is not set!" -ForegroundColor Yellow
}

# Start Minikube
Write-Host "📦 Starting Minikube cluster..." -ForegroundColor Cyan
minikube start --profile=$PROFILE --cpus=4 --memory=8192 --disk-size=20g --driver=docker
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Minikube may already be running, continuing..." -ForegroundColor Yellow
}

# Enable addons
Write-Host "🔧 Enabling Minikube addons..." -ForegroundColor Cyan
minikube addons enable ingress --profile=$PROFILE
minikube addons enable metrics-server --profile=$PROFILE

# Set Docker environment
Write-Host "🐳 Configuring Docker environment..." -ForegroundColor Cyan
& minikube docker-env --profile=$PROFILE | Invoke-Expression

# Build images
Write-Host "📦 Building Docker images..." -ForegroundColor Cyan
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend image" -ForegroundColor Red
    exit 1
}

docker build -t todo-backend:latest -f backend/Dockerfile backend/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Images built successfully" -ForegroundColor Green

# Install backend Helm chart
Write-Host "📊 Installing backend Helm chart..." -ForegroundColor Cyan
helm upgrade --install todo-backend ./helm/todo-backend `
  --set secrets.databaseUrl="$env:DATABASE_URL" `
  --set secrets.betterAuthSecret="$env:BETTER_AUTH_SECRET" `
  --set secrets.openaiApiKey="$env:OPENAI_API_KEY" `
  --set secrets.jwtSecretKey="$env:JWT_SECRET_KEY" `
  --set config.corsOrigins="http://localhost:30000,http://localhost:5173"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend chart" -ForegroundColor Red
    exit 1
}

# Install frontend Helm chart
Write-Host "📊 Installing frontend Helm chart..." -ForegroundColor Cyan
helm upgrade --install todo-frontend ./helm/todo-frontend `
  --set config.backendApiUrl="http://todo-backend:8000"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend chart" -ForegroundColor Red
    exit 1
}

# Wait for pods to be ready
Write-Host "⏳ Waiting for pods to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=todo-backend --timeout=300s
kubectl wait --for=condition=ready pod -l app=todo-frontend --timeout=300s

# Get access information
$NODE_IP = minikube ip --profile=$PROFILE
$NODE_PORT = kubectl get svc todo-frontend -o jsonpath='{.spec.ports[0].nodePort}'
if (-not $NODE_PORT) { $NODE_PORT = "30000" }

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Status:" -ForegroundColor Cyan
kubectl get pods -l 'app in (todo-frontend,todo-backend)'
Write-Host ""
Write-Host "🌐 Access Information:" -ForegroundColor Cyan
Write-Host "   Frontend URL: http://${NODE_IP}:${NODE_PORT}"
Write-Host "   Backend Service: http://todo-backend:8000 (internal)"
Write-Host ""
Write-Host "🔍 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View pods: kubectl get pods"
Write-Host "   View services: kubectl get svc"
Write-Host "   View logs: kubectl logs -l app=todo-backend"
Write-Host "   Port forward: kubectl port-forward svc/todo-backend 8000:8000"
Write-Host ""
