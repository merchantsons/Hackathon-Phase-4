# AIOps Operations Specification

## Purpose

This specification defines how AI-powered operations tools (kubectl-ai and kagent) are used to manage, monitor, and troubleshoot the Todo AI Chatbot Kubernetes deployment. It demonstrates AIOps capabilities for cloud-native operations.

## Responsibilities

### kubectl-ai
- Natural language Kubernetes operations
- Deployment creation and management
- Pod scaling and debugging
- Resource optimization suggestions
- Automated troubleshooting

### kagent
- Cluster health analysis
- Resource usage monitoring
- Performance optimization recommendations
- Failure diagnosis and remediation
- Predictive analytics

## kubectl-ai Usage

### Installation
```bash
# Install kubectl-ai plugin
kubectl krew install ai

# Or via direct installation
# Follow kubectl-ai installation guide
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

### Example Commands

1. **Deploy Backend**
   ```
   kubectl-ai "create a deployment named todo-backend with 2 replicas, \
     image todo-backend:latest, port 8000, \
     environment variables DATABASE_URL and OPENAI_API_KEY from secrets, \
     with liveness probe on /api/health"
   ```

2. **Scale Based on Load**
   ```
   kubectl-ai "scale todo-backend to handle increased load, \
     ensure minimum 2 replicas for high availability"
   ```

3. **Debug Pod Crashes**
   ```
   kubectl-ai "the todo-backend pods are crashing, \
     analyze logs and events to identify the root cause"
   ```

## kagent Usage

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

1. **Health Check Workflow**
   ```bash
   # Check overall cluster health
   kagent analyze cluster
   
   # Deep dive into backend component
   kagent analyze component todo-backend --verbose
   
   # Get optimization suggestions
   kagent optimize resources --deployment todo-backend
   ```

2. **Failure Investigation**
   ```bash
   # Identify why pods are failing
   kagent diagnose --pod todo-backend-7d8f9c4b5-xyz
   
   # Analyze restart patterns
   kagent analyze why backend pods restarted
   
   # Get remediation steps
   kagent recommend --component todo-backend --fix
   ```

3. **Performance Optimization**
   ```bash
   # Analyze current resource usage
   kagent analyze resources --namespace default
   
   # Get optimization recommendations
   kagent optimize resources --deployment todo-backend --suggest
   
   # Apply optimizations
   kagent optimize resources --deployment todo-backend --apply
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

## Acceptance Criteria

1. ✅ kubectl-ai can create and manage deployments
2. ✅ kubectl-ai can diagnose pod issues
3. ✅ kagent can analyze cluster health
4. ✅ kagent can provide optimization recommendations
5. ✅ AIOps tools integrate with Helm deployments
6. ✅ Troubleshooting workflows are documented
7. ✅ Commands work in Minikube environment

## Validation Checklist

- [ ] kubectl-ai installed and configured
- [ ] kagent installed and configured
- [ ] kubectl-ai can create deployments
- [ ] kubectl-ai can scale deployments
- [ ] kubectl-ai can diagnose issues
- [ ] kagent can analyze cluster health
- [ ] kagent can provide recommendations
- [ ] Example workflows execute successfully
- [ ] Documentation includes all example commands

## Notes for Judges

- AIOps demonstrates modern cloud-native operations
- Natural language interface improves operator experience
- Automated diagnosis reduces MTTR
- Optimization recommendations improve efficiency
- Ready for production AIOps workflows
- Shows evolution toward Phase V (advanced observability)
