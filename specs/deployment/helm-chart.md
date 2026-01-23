# Helm Chart Specification

## Purpose

This specification defines Helm chart structure for deploying the Todo AI Chatbot application on Kubernetes. It covers separate charts for frontend and backend, with support for scaling, configuration management, and production-ready patterns.

## Responsibilities

### Chart Structure
- Separate Helm charts for frontend and backend
- Reusable templates
- ConfigMap and Secret management
- Resource limits and requests
- Horizontal Pod Autoscaling support
- Service configuration

### Frontend Chart (`helm/todo-frontend`)
- Deployment with configurable replicas
- Service (NodePort for local access)
- ConfigMap for environment variables
- Resource limits
- Health probes
 - Runtime config injection via `BACKEND_API_URL` env var (nginx generates `/config.js`)

### Backend Chart (`helm/todo-backend`)
- Deployment with configurable replicas
- Service (ClusterIP)
- ConfigMap for non-sensitive config
- Secret template for sensitive data
- Resource limits
- Health probes
- MCP integration support

## Chart Structure

```
helm/
├── todo-frontend/
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── templates/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── NOTES.txt
│   └── .helmignore
│
└── todo-backend/
    ├── Chart.yaml
    ├── values.yaml
    ├── templates/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   ├── configmap.yaml
    │   ├── secret.yaml
    │   └── NOTES.txt
    └── .helmignore
```

## Frontend Chart Specification

### Chart.yaml
```yaml
apiVersion: v2
name: todo-frontend
description: Todo AI Chatbot Frontend
type: application
version: 1.0.0
appVersion: "1.0.0"
```

### values.yaml Schema
```yaml
replicaCount: 1

image:
  repository: todo-frontend
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: NodePort
  port: 3000
  nodePort: 30000

config:
  backendApiUrl: "http://todo-backend:8000"
  appName: "Todo AI Chatbot"

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Deployment Template
- Uses `apps/v1` Deployment API
- Replicas from `values.yaml`
- Image from values
- Environment variables from values / ConfigMap
- Resource limits from values
- Health probes from values
- Non-root user security context

#### Frontend Runtime Config (Required)
- The frontend container uses nginx and generates `/config.js` on startup.
- Helm must set:
  - `BACKEND_API_URL={{ .Values.config.backendApiUrl }}`
  - (Optional) `VITE_APP_NAME={{ .Values.config.appName }}`

### Service Template
- Type: NodePort (for local Minikube access)
- Port: 3000
- Selector: `app: todo-frontend`

### ConfigMap Template
- Frontend environment variables
- Backend API URL
- Application name

## Backend Chart Specification

### Chart.yaml
```yaml
apiVersion: v2
name: todo-backend
description: Todo AI Chatbot Backend with MCP
type: application
version: 1.0.0
appVersion: "1.0.0"
```

### values.yaml Schema
```yaml
replicaCount: 2

image:
  repository: todo-backend
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8000

config:
  corsOrigins: "http://localhost:30000,http://localhost:5173"
  jwtAlgorithm: "HS256"

secrets:
  databaseUrl: ""  # Override via --set or secret file
  betterAuthSecret: ""
  openaiApiKey: ""
  jwtSecretKey: ""

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi

livenessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Deployment Template
- Uses `apps/v1` Deployment API
- Replicas from `values.yaml` (default: 2 for HA)
- Image from values
- Environment variables from ConfigMap and Secrets
- Resource limits from values
- Health probes from values
- Non-root user security context
- MCP server runs as part of backend process

### Service Template
- Type: ClusterIP
- Port: 8000
- Selector: `app: todo-backend`

### ConfigMap Template
- Non-sensitive configuration
- CORS origins
- JWT algorithm

### Secret Template
- Sensitive data (database URL, API keys)
- Supports external secrets (via `--set` or secret file)
- Base64 encoding handled by Helm

## Installation Instructions

### Frontend
```bash
helm install todo-frontend ./helm/todo-frontend \
  --set config.backendApiUrl=http://todo-backend:8000
```

### Backend
```bash
helm install todo-backend ./helm/todo-backend \
  --set secrets.databaseUrl="postgresql://..." \
  --set secrets.betterAuthSecret="..." \
  --set secrets.openaiApiKey="..." \
  --set secrets.jwtSecretKey="..."
```

## Scaling

### Manual Scaling
```bash
helm upgrade todo-backend ./helm/todo-backend \
  --set replicaCount=5
```

### Horizontal Pod Autoscaling (Future)
- Can be added via HPA resource
- Based on CPU/memory metrics
- Min replicas: 2, Max replicas: 10

## NOTES.txt Template

Both charts should include NOTES.txt with:
- Access instructions
- Service endpoints
- Health check URLs
- Troubleshooting tips

### Frontend NOTES.txt
```
1. Get the application URL by running these commands:
   export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services todo-frontend)
   export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
   echo http://$NODE_IP:$NODE_PORT

2. Verify the deployment:
   kubectl get pods -l app=todo-frontend
   kubectl get svc todo-frontend
```

### Backend NOTES.txt
```
1. Backend is accessible within cluster at:
   http://todo-backend:8000

2. Verify the deployment:
   kubectl get pods -l app=todo-backend
   kubectl get svc todo-backend
   kubectl logs -l app=todo-backend

3. Check health:
   kubectl exec -it <pod-name> -- curl http://localhost:8000/api/health
```

## Acceptance Criteria

1. ✅ Charts install successfully via Helm
2. ✅ All resources created (Deployment, Service, ConfigMap, Secret)
3. ✅ Pods start and become ready
4. ✅ Services route traffic correctly
5. ✅ Environment variables loaded from ConfigMaps/Secrets
6. ✅ Health probes configured correctly
7. ✅ Scaling works (replicas can be increased)
8. ✅ NOTES.txt provides clear instructions

## Validation Checklist

- [ ] `helm lint` passes for both charts
- [ ] `helm install` succeeds
- [ ] All pods in `Running` state
- [ ] Services have valid endpoints
- [ ] ConfigMaps contain correct values
- [ ] Secrets are properly encoded
- [ ] Health probes respond
- [ ] Frontend can reach backend
- [ ] Scaling works (`helm upgrade --set replicaCount=N`)
- [ ] `helm uninstall` cleans up resources

## Notes for Judges

- Helm charts follow best practices
- Separate charts enable independent scaling
- ConfigMaps and Secrets properly separated
- Production-ready resource limits
- Clear documentation in NOTES.txt
- Ready for CI/CD integration
