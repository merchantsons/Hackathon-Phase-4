#!/bin/bash
# Minikube Deployment Script
# Generated from: specs/deployment/minikube.md

set -e

PROFILE=${MINIKUBE_PROFILE:-todo-hackathon}

echo "🚀 Starting Minikube deployment for Todo AI Chatbot..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

if [ -z "$BETTER_AUTH_SECRET" ]; then
    echo "❌ ERROR: BETTER_AUTH_SECRET environment variable is not set!"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY environment variable is not set!"
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    echo "⚠️  WARNING: JWT_SECRET_KEY environment variable is not set!"
fi

# Start Minikube
echo "📦 Starting Minikube cluster..."
minikube start --profile=$PROFILE --cpus=4 --memory=8192 --disk-size=20g --driver=docker || {
    echo "⚠️  Minikube may already be running, continuing..."
}

# Enable addons
echo "🔧 Enabling Minikube addons..."
minikube addons enable ingress --profile=$PROFILE || true
minikube addons enable metrics-server --profile=$PROFILE || true

# Set Docker environment
echo "🐳 Configuring Docker environment..."
eval $(minikube docker-env --profile=$PROFILE)

# Build images
echo "📦 Building Docker images..."
docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/ || {
    echo "❌ Failed to build frontend image"
    exit 1
}

docker build -t todo-backend:latest -f backend/Dockerfile backend/ || {
    echo "❌ Failed to build backend image"
    exit 1
}

echo "✅ Images built successfully"

# Install backend Helm chart
echo "📊 Installing backend Helm chart..."
helm upgrade --install todo-backend ./helm/todo-backend \
  --set secrets.databaseUrl="${DATABASE_URL}" \
  --set secrets.betterAuthSecret="${BETTER_AUTH_SECRET}" \
  --set secrets.openaiApiKey="${OPENAI_API_KEY:-}" \
  --set secrets.jwtSecretKey="${JWT_SECRET_KEY:-}" \
  --set config.corsOrigins="http://localhost:30000,http://localhost:5173" || {
    echo "❌ Failed to install backend chart"
    exit 1
}

# Install frontend Helm chart
echo "📊 Installing frontend Helm chart..."
helm upgrade --install todo-frontend ./helm/todo-frontend \
  --set config.backendApiUrl="http://todo-backend:8000" || {
    echo "❌ Failed to install frontend chart"
    exit 1
}

# Wait for pods to be ready
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=todo-backend --timeout=300s || {
    echo "⚠️  Backend pods not ready within timeout"
}

kubectl wait --for=condition=ready pod -l app=todo-frontend --timeout=300s || {
    echo "⚠️  Frontend pods not ready within timeout"
}

# Get access information
NODE_IP=$(minikube ip --profile=$PROFILE)
NODE_PORT=$(kubectl get svc todo-frontend -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30000")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Deployment Status:"
kubectl get pods -l 'app in (todo-frontend,todo-backend)'
echo ""
echo "🌐 Access Information:"
echo "   Frontend URL: http://${NODE_IP}:${NODE_PORT}"
echo "   Backend Service: http://todo-backend:8000 (internal)"
echo ""
echo "🔍 Useful Commands:"
echo "   View pods: kubectl get pods"
echo "   View services: kubectl get svc"
echo "   View logs: kubectl logs -l app=todo-backend"
echo "   Port forward: kubectl port-forward svc/todo-backend 8000:8000"
echo ""
