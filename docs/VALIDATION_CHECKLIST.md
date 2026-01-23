# Phase IV Validation Checklist

## Generated from: specs/architecture/kubernetes-overview.md, specs/deployment/containerization.md, specs/deployment/helm-chart.md, specs/deployment/minikube.md

Use this checklist to validate Phase IV deployment for judge evaluation.

## Pre-Deployment Validation

### Environment Setup
- [ ] Minikube installed and accessible
- [ ] Helm 3.x installed
- [ ] kubectl configured for Minikube
- [ ] Docker available and working
- [ ] Environment variables set:
  - [ ] DATABASE_URL
  - [ ] BETTER_AUTH_SECRET
  - [ ] OPENAI_API_KEY (optional)
  - [ ] JWT_SECRET_KEY (optional)

### Specifications
- [ ] All specs exist in `specs/` directory:
  - [ ] `specs/architecture/kubernetes-overview.md`
  - [ ] `specs/deployment/containerization.md`
  - [ ] `specs/deployment/helm-chart.md`
  - [ ] `specs/deployment/minikube.md`
  - [ ] `specs/aiops/ai-operations.md`
- [ ] `.spec-kit/config.yaml` configured correctly

## Docker Validation

### Image Building
- [ ] Frontend Dockerfile builds successfully
- [ ] Backend Dockerfile builds successfully
- [ ] Images tagged correctly (`todo-frontend:latest`, `todo-backend:latest`)
- [ ] Image sizes are reasonable (< 500MB frontend, < 800MB backend)
- [ ] `.dockerignore` files exclude unnecessary files

### Image Security
- [ ] Containers run as non-root users
- [ ] Multi-stage builds used
- [ ] Minimal base images (Alpine/slim)
- [ ] No unnecessary packages included

## Helm Chart Validation

### Chart Structure
- [ ] Frontend chart exists: `helm/todo-frontend/`
- [ ] Backend chart exists: `helm/todo-backend/`
- [ ] Both charts have:
  - [ ] `Chart.yaml`
  - [ ] `values.yaml`
  - [ ] `templates/` directory
  - [ ] `NOTES.txt`
  - [ ] `.helmignore`

### Chart Linting
- [ ] `helm lint ./helm/todo-frontend` passes
- [ ] `helm lint ./helm/todo-backend` passes
- [ ] No template errors

### Chart Installation
- [ ] Backend chart installs successfully
- [ ] Frontend chart installs successfully
- [ ] All resources created:
  - [ ] Deployments
  - [ ] Services
  - [ ] ConfigMaps
  - [ ] Secrets (backend only)

## Kubernetes Deployment Validation

### Pod Status
- [ ] All pods in `Running` state
  ```bash
  kubectl get pods -l 'app in (todo-frontend,todo-backend)'
  ```
- [ ] No pod restarts (unless intentional)
- [ ] Pods have correct labels

### Services
- [ ] Frontend service has NodePort
- [ ] Backend service has ClusterIP
- [ ] Services have valid endpoints
  ```bash
  kubectl get endpoints
  ```

### Configuration
- [ ] ConfigMaps contain correct values
- [ ] Secrets are properly encoded
- [ ] Environment variables loaded correctly
- [ ] CORS origins configured correctly

### Health Probes
- [ ] Frontend liveness probe responds
- [ ] Frontend readiness probe responds
- [ ] Backend liveness probe responds (`/api/health`)
- [ ] Backend readiness probe responds (`/api/health`)

## Application Functionality

### Frontend Access
- [ ] Frontend accessible via NodePort URL
- [ ] UI loads correctly
- [ ] No console errors

### Backend API
- [ ] Backend health endpoint responds
  ```bash
  kubectl exec -it <pod-name> -- curl http://localhost:8000/api/health
  ```
- [ ] Database connection successful
- [ ] API endpoints functional

### End-to-End Flow
- [ ] User can sign up/login
- [ ] User can create tasks
- [ ] User can view tasks
- [ ] User can update tasks
- [ ] User can delete tasks
- [ ] User can complete tasks

### Chatbot & MCP
- [ ] Chatbot interface accessible
- [ ] Chatbot can create tasks via MCP
- [ ] Chatbot can list tasks via MCP
- [ ] Chatbot can update tasks via MCP
- [ ] Chatbot can delete tasks via MCP
- [ ] MCP tools execute correctly

## Stateless Backend Validation

- [ ] No persistent volumes required
- [ ] Backend pods can be scaled horizontally
- [ ] Multiple replicas work correctly
- [ ] Pods restart cleanly (no state loss)
- [ ] All state persisted in external database

## Scaling Validation

- [ ] Backend can be scaled to 2+ replicas
- [ ] Frontend can be scaled to 2+ replicas
- [ ] Load balancing works across replicas
- [ ] No conflicts with multiple replicas

## AIOps Validation

### kubectl-ai
- [ ] kubectl-ai installed
- [ ] Can create deployments via natural language
- [ ] Can scale deployments
- [ ] Can diagnose pod issues

### kagent
- [ ] kagent installed (if available)
- [ ] Can analyze cluster health
- [ ] Can provide optimization recommendations
- [ ] Can diagnose failures

## Documentation Validation

- [ ] README.md updated with Phase IV section
- [ ] Architecture diagram included
- [ ] Deployment instructions clear
- [ ] AIOps usage documented
- [ ] Troubleshooting section included
- [ ] Access URLs provided

## Spec-Driven Development Validation

- [ ] All Dockerfiles trace to `specs/deployment/containerization.md`
- [ ] All Helm charts trace to `specs/deployment/helm-chart.md`
- [ ] Deployment scripts trace to `specs/deployment/minikube.md`
- [ ] AIOps documentation traces to `specs/aiops/ai-operations.md`
- [ ] `.spec-kit/config.yaml` references all specs

## Production-Grade Features

- [ ] Resource limits configured
- [ ] Resource requests configured
- [ ] Security contexts (non-root) configured
- [ ] Health probes configured
- [ ] ConfigMaps and Secrets properly separated
- [ ] Multi-stage Docker builds
- [ ] Optimized image sizes
- [ ] Clear NOTES.txt in Helm charts

## Cleanup Validation

- [ ] `helm uninstall` removes all resources
- [ ] No orphaned resources after uninstall
- [ ] Minikube can be stopped/started cleanly

## Judge Evaluation Checklist

### Quick Start
- [ ] One-command deployment works
- [ ] Clear access instructions provided
- [ ] Application functional within 10 minutes

### Code Quality
- [ ] All code follows specifications
- [ ] Clear comments and documentation
- [ ] Consistent formatting

### Architecture
- [ ] Clear separation of concerns
- [ ] Stateless design verified
- [ ] Scalable architecture
- [ ] Production-ready patterns

### Innovation
- [ ] AIOps integration demonstrated
- [ ] Spec-driven development followed
- [ ] Clear path to Phase V

## Final Validation

- [ ] All items above checked
- [ ] Application fully functional
- [ ] Documentation complete
- [ ] Ready for judge evaluation

---

**Validation Date**: _______________

**Validated By**: _______________

**Notes**: 
_________________________________________________
_________________________________________________
_________________________________________________
