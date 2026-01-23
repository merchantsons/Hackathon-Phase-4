# AIOps Quick Reference

## Generated from: specs/aiops/ai-operations.md

This document provides quick reference commands for using kubectl-ai and kagent with the Todo AI Chatbot Kubernetes deployment.

## kubectl-ai Commands

### Installation
```bash
# Install kubectl-ai plugin
kubectl krew install ai
# Or follow kubectl-ai installation guide
```

### Deployment Operations

#### Create Deployment
```bash
kubectl-ai "deploy the todo backend with 2 replicas, using image todo-backend:latest, with 512Mi memory limit"
```

#### Scale Deployment
```bash
kubectl-ai "scale the todo-backend deployment to 5 replicas"
```

#### Update Configuration
```bash
kubectl-ai "update the todo-backend deployment to use image todo-backend:v1.1.0"
```

### Debugging Operations

#### Diagnose Failing Pods
```bash
kubectl-ai "why are the todo-backend pods restarting?"
```

#### Check Resource Issues
```bash
kubectl-ai "analyze resource usage for todo-backend pods and suggest optimizations"
```

#### Troubleshoot Connectivity
```bash
kubectl-ai "why can't the frontend connect to the backend service?"
```

### Example Workflows

#### Complete Deployment
```bash
kubectl-ai "create a deployment named todo-backend with 2 replicas, \
  image todo-backend:latest, port 8000, \
  environment variables DATABASE_URL and OPENAI_API_KEY from secrets, \
  with liveness probe on /api/health"
```

## kagent Commands

### Installation
```bash
# Install kagent
# Follow kagent installation guide from project repository
```

### Cluster Health Analysis

#### Overall Health Check
```bash
kagent analyze cluster --namespace default
```

#### Component Health
```bash
kagent analyze component todo-backend
kagent analyze component todo-frontend
```

### Resource Optimization

#### Analyze Resource Usage
```bash
kagent optimize resources --deployment todo-backend
```

#### Get Recommendations
```bash
kagent recommend --component todo-backend
```

### Failure Diagnosis

#### Diagnose Backend Issues
```bash
kagent diagnose --pod todo-backend-*
```

#### Analyze Restart Patterns
```bash
kagent analyze why backend pods restarted
```

### Example Workflows

#### Health Check Workflow
```bash
# Check overall cluster health
kagent analyze cluster

# Deep dive into backend component
kagent analyze component todo-backend --verbose

# Get optimization suggestions
kagent optimize resources --deployment todo-backend
```

#### Failure Investigation
```bash
# Identify why pods are failing
kagent diagnose --pod todo-backend-7d8f9c4b5-xyz

# Analyze restart patterns
kagent analyze why backend pods restarted

# Get remediation steps
kagent recommend --component todo-backend --fix
```

## AIOps Workflow Examples

### Scenario 1: Pod Restart Investigation

```bash
# Step 1: Identify the issue
kubectl-ai "why are todo-backend pods restarting?"

# Step 2: Deep analysis with kagent
kagent diagnose --pod todo-backend-*

# Step 3: Get recommendations
kagent recommend --component todo-backend --fix

# Step 4: Apply fix via kubectl-ai
kubectl-ai "apply the recommended fix for todo-backend pod restarts"
```

### Scenario 2: Scaling Decision

```bash
# Step 1: Analyze current load
kagent analyze resources --deployment todo-backend

# Step 2: Get scaling recommendation
kagent recommend --component todo-backend --scale

# Step 3: Scale using kubectl-ai
kubectl-ai "scale todo-backend based on current resource usage and load patterns"
```

### Scenario 3: Performance Optimization

```bash
# Step 1: Identify bottlenecks
kagent analyze performance --component todo-backend

# Step 2: Get optimization suggestions
kagent optimize resources --deployment todo-backend

# Step 3: Apply optimizations
kubectl-ai "update todo-backend deployment with optimized resource limits"
```

## Integration with Deployment

### Pre-Deployment Checks
```bash
# Validate cluster readiness
kagent analyze cluster --pre-deployment

# Check resource availability
kagent check resources --required cpu=2 memory=4Gi
```

### Post-Deployment Validation
```bash
# Verify deployment health
kagent analyze component todo-backend
kagent analyze component todo-frontend

# Check service connectivity
kagent verify connectivity --from todo-frontend --to todo-backend
```

### Continuous Monitoring
```bash
# Set up monitoring
kagent monitor --component todo-backend --interval 30s

# Alert on issues
kagent alert --condition "pod-restarts > 3"
```

## Notes

- All commands assume kubectl is configured for Minikube
- Replace `todo-backend` with `todo-frontend` for frontend operations
- Commands may vary based on kubectl-ai and kagent versions
- See `specs/aiops/ai-operations.md` for detailed specifications
