#!/bin/bash
# Test Docker build script
# Validates that Dockerfiles build correctly

set -e

echo "🐳 Testing Docker builds..."

# Test frontend build
echo "📦 Building frontend image..."
docker build -t todo-frontend:test -f frontend/Dockerfile frontend/ || {
    echo "❌ Frontend build failed"
    exit 1
}
echo "✅ Frontend build successful"

# Test backend build
echo "📦 Building backend image..."
docker build -t todo-backend:test -f backend/Dockerfile backend/ || {
    echo "❌ Backend build failed"
    exit 1
}
echo "✅ Backend build successful"

# Check image sizes
echo "📊 Image sizes:"
docker images todo-frontend:test todo-backend:test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "✅ All Docker builds successful!"
