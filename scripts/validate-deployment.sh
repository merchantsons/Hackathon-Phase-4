#!/bin/bash
# Validation script for Phase IV deployment
# Generated from: specs/deployment/minikube.md

set -e

echo "🔍 Validating Phase IV Deployment..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v minikube >/dev/null 2>&1 || { echo "❌ minikube not found"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "❌ helm not found"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl not found"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker not found"; exit 1; }
echo "✅ All prerequisites met"

# Check Minikube status
echo "📦 Checking Minikube status..."
if minikube status >/dev/null 2>&1; then
    echo "✅ Minikube is running"
else
    echo "⚠️  Minikube is not running"
fi

# Validate Helm charts
echo "📊 Validating Helm charts..."
helm lint ./helm/todo-frontend || { echo "❌ Frontend chart validation failed"; exit 1; }
helm lint ./helm/todo-backend || { echo "❌ Backend chart validation failed"; exit 1; }
echo "✅ Helm charts are valid"

# Check if deployments exist
echo "🔍 Checking Kubernetes deployments..."
if kubectl get deployment todo-frontend >/dev/null 2>&1; then
    echo "✅ Frontend deployment exists"
    kubectl get pods -l app=todo-frontend
else
    echo "⚠️  Frontend deployment not found"
fi

if kubectl get deployment todo-backend >/dev/null 2>&1; then
    echo "✅ Backend deployment exists"
    kubectl get pods -l app=todo-backend
else
    echo "⚠️  Backend deployment not found"
fi

# Check pod status
echo "📊 Checking pod status..."
PODS=$(kubectl get pods -l 'app in (todo-frontend,todo-backend)' --no-headers 2>/dev/null || echo "")
if [ -n "$PODS" ]; then
    echo "$PODS"
    FAILING=$(echo "$PODS" | grep -v "Running" | grep -v "Completed" || true)
    if [ -n "$FAILING" ]; then
        echo "⚠️  Some pods are not in Running state:"
        echo "$FAILING"
    else
        echo "✅ All pods are running"
    fi
else
    echo "⚠️  No pods found"
fi

# Check services
echo "🌐 Checking services..."
kubectl get svc todo-frontend todo-backend 2>/dev/null || echo "⚠️  Services not found"

# Check health endpoints
echo "🏥 Checking health endpoints..."
BACKEND_POD=$(kubectl get pod -l app=todo-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$BACKEND_POD" ]; then
    if kubectl exec "$BACKEND_POD" -- curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
        echo "✅ Backend health check passed"
    else
        echo "⚠️  Backend health check failed"
    fi
else
    echo "⚠️  Backend pod not found"
fi

echo ""
echo "✅ Validation complete!"
echo ""
echo "📋 Summary:"
echo "  - Prerequisites: ✅"
echo "  - Helm charts: ✅"
echo "  - Deployments: Check above"
echo "  - Pods: Check above"
echo "  - Services: Check above"
echo "  - Health: Check above"
