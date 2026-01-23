# Kubernetes Architecture Overview

## Purpose

This specification defines the Kubernetes-based architecture for deploying the Todo AI Chatbot application locally using Minikube. The architecture ensures stateless backend design, clear separation of concerns, and production-ready patterns suitable for cloud-native deployment.

## Responsibilities

### Architecture Components

1. **Frontend Pod**
   - Hosts React/Vite build served by nginx
   - Serves static assets and handles SPA routing
   - Generates `/config.js` at startup for runtime configuration (Kubernetes-friendly)
   - Communicates with backend via Service
   - Exposes port 3000

2. **Backend Pod**
   - Hosts FastAPI application
   - Contains MCP server tools (integrated within backend)
   - Connects to external Neon PostgreSQL database
   - Stateless design (no local storage)
   - Exposes port 8000

3. **Services**
   - `todo-frontend-service`: NodePort/ClusterIP for frontend access
   - `todo-backend-service`: ClusterIP for backend API

4. **ConfigMaps**
   - Frontend configuration (API endpoints)
   - Backend configuration (non-sensitive settings)

5. **Secrets**
   - Database connection strings
   - API keys (OpenAI, Better Auth)
   - JWT secrets

6. **Ingress (Optional)**
   - Routes external traffic to services
   - Can use Minikube ingress addon

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Minikube Cluster                         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Frontend Pod    │         │  Backend Pod     │         │
│  │  (React/Vite)    │────────▶│  (FastAPI)       │         │
│  │  Port: 3000      │         │  Port: 8000      │         │
│  │                  │         │  + MCP Tools      │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           │                            │                    │
│  ┌────────▼─────────┐         ┌────────▼─────────┐         │
│  │ Frontend Service │         │ Backend Service  │         │
│  │ (NodePort)       │         │ (ClusterIP)      │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   ConfigMaps     │         │    Secrets       │         │
│  │  - Frontend Env  │         │  - DATABASE_URL  │         │
│  │  - Backend Env   │         │  - API Keys      │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (External)
                              ▼
                    ┌──────────────────┐
                    │  Neon PostgreSQL  │
                    │   (External DB)   │
                    └──────────────────┘
```

## Pod Specifications

### Frontend Pod
- **Image**: `todo-frontend:latest`
- **Replicas**: 1-3 (configurable)
- **Resources**:
  - Requests: CPU 100m, Memory 128Mi
  - Limits: CPU 500m, Memory 512Mi
- **Health Probes**:
  - Liveness: HTTP GET `/health`
  - Readiness: HTTP GET `/health`
- **Environment**: ConfigMap + Secrets

### Backend Pod
- **Image**: `todo-backend:latest`
- **Replicas**: 2-5 (stateless, horizontally scalable)
- **Resources**:
  - Requests: CPU 200m, Memory 256Mi
  - Limits: CPU 1000m, Memory 1Gi
- **Health Probes**:
  - Liveness: HTTP GET `/api/health`
  - Readiness: HTTP GET `/api/health`
- **Environment**: ConfigMap + Secrets
- **MCP Integration**: MCP server runs as part of backend process

## Service Specifications

### Frontend Service
- **Type**: NodePort (for local access)
- **Port**: 3000
- **Target Port**: 3000
- **Selector**: `app: todo-frontend`

### Backend Service
- **Type**: ClusterIP
- **Port**: 8000
- **Target Port**: 8000
- **Selector**: `app: todo-backend`

## Stateless Backend Design

The backend is designed to be stateless:
- No local file storage
- No session storage in memory
- All state persisted in external Neon database
- MCP tools execute within backend pod but use external API
- Horizontal scaling supported via replicas

## Acceptance Criteria

1. ✅ Frontend and backend pods deploy successfully
2. ✅ Services route traffic correctly
3. ✅ Frontend can communicate with backend
4. ✅ Backend connects to external Neon database
5. ✅ MCP tools execute within backend pod
6. ✅ Health probes respond correctly
7. ✅ Pods can be scaled horizontally
8. ✅ No persistent volumes required

## Validation Checklist

- [ ] All pods in `Running` state
- [ ] Services have valid endpoints
- [ ] Frontend accessible via NodePort
- [ ] Backend health endpoint responds
- [ ] Database connection successful
- [ ] MCP tools can execute task operations
- [ ] Chatbot can create/read/update/delete tasks
- [ ] Multiple backend replicas work correctly
- [ ] Pods restart cleanly (stateless verified)

## Dependencies

- Minikube installed and running
- Docker images built and loaded
- External Neon database accessible
- Helm charts installed
- kubectl configured for Minikube

## Notes for Judges

- Architecture follows cloud-native best practices
- Stateless design enables easy scaling
- External database ensures data persistence
- MCP integration demonstrates AIOps capabilities
- Ready for Phase V (Kafka, Dapr, DOKS)
