# Todo With Chatbot

**Hackathon**: Hackathon II  
**Phase**: Phase IV — Local Kubernetes Deployment </br> 
**BY**: GIAIC - MERCHANTSONS - 00037391 </br>
---

A modern, feature-rich Todo application built following **Spec-Driven Development (SDD)** methodology. This application provides a complete task management solution with CRUD operations, filtering, sorting, search capabilities, and an intelligent chatbot assistant for natural language task management.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Phase IV: Kubernetes Deployment](#phase-iv-kubernetes-deployment)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Usage](#usage)
- [Architecture](#architecture)
- [Testing](#testing)
- [Browser Support](#browser-support)

## 🎯 Project Overview

This project implements a Todo application following **Spec-Driven Development (SDD)** principles. Phase IV adds local Kubernetes deployment using Minikube, Helm charts, and AIOps tools. The application provides:

- **Complete CRUD Operations**: Create, read, update, and delete todos
- **Advanced Filtering & Sorting**: Filter by status, priority, due date, and sort by multiple criteria
- **Real-time Search**: Search todos by title or description
- **User Authentication**: Secure sign up, login, and session management
- **Database Persistence**: Neon PostgreSQL database for reliable data storage
- **AI Chatbot Assistant**: Natural language interface for task management
- **Responsive Design**: Beautiful UI that works on all screen sizes
- **Modern UI/UX**: Dark green gradient theme with intuitive user experience

## ✨ Features

### Core Features
- ✅ **Create Todos**: Add tasks with title, description, priority, and due date
- ✅ **View Todos**: Display all tasks in a responsive 2-column layout
- ✅ **Update Todos**: Edit existing tasks with a modal popup
- ✅ **Delete Todos**: Remove tasks with confirmation dialog
- ✅ **Complete Todos**: Toggle task completion status
- ✅ **Priority Levels**: Set tasks as Low, Medium, or High priority with color-coded badges
- ✅ **Due Dates**: Set and track due dates with overdue indicators

### Organization Features
- ✅ **Filtering**: Filter by status (All, Pending, Completed), priority (All, Low, Medium, High), and due date (Today, This Week, Overdue, All)
- ✅ **Sorting**: Sort by due date, priority, creation date, or alphabetically (ascending/descending)
- ✅ **Search**: Real-time search by title or description (case-insensitive)

### Chatbot Features
- ✅ **Natural Language Commands**: Interact with the application using natural language
- ✅ **Create Todos**: "Create a todo called [title]" or "Add a new todo [title]"
- ✅ **View Todos**: "Show my todos" or "What are my todos"
- ✅ **Complete Todos**: "Complete the todo [title]" or "Mark [title] as done"
- ✅ **Delete Todos**: "Delete the todo [title]" or "Remove [title]"
- ✅ **Task Queries**: "How many todos do I have" or "Count my todos"
- ✅ **Detailed Descriptions**: Automatically generates comprehensive descriptions for all created tasks

### UI/UX Features
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ✅ **2-Column Layout**: Optimized layout for efficient task management
- ✅ **Toast Notifications**: Beautiful toast notifications for user feedback
- ✅ **Confirmation Dialogs**: Custom confirmation dialogs for important actions
- ✅ **Password Strength Indicator**: Visual password strength feedback during signup
- ✅ **Modern Gradient Theme**: Darkest green gradient color scheme
- ✅ **Custom Fonts**: Quintessential font for elegant typography

## 🚀 Phase IV: Kubernetes Deployment

### Overview

Phase IV deploys the Todo AI Chatbot on local Kubernetes using Minikube, following cloud-native best practices. All deployment artifacts are generated from Spec-Kit specifications, ensuring traceability and maintainability.

### Architecture

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
│  ┌────────▼─────────┐         ┌────────▼─────────┐         │
│  │ Frontend Service │         │ Backend Service  │         │
│  │ (NodePort)       │         │ (ClusterIP)      │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   ConfigMaps     │         │    Secrets       │         │
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

### Key Features

- ✅ **Docker Containerization**: Multi-stage builds for frontend and backend
- ✅ **Helm Charts**: Separate charts for frontend and backend with ConfigMaps and Secrets
- ✅ **Minikube Deployment**: Local Kubernetes cluster for development and testing
- ✅ **Stateless Backend**: Horizontally scalable with external database
- ✅ **AIOps Integration**: kubectl-ai and kagent for intelligent operations
- ✅ **Production-Ready**: Health probes, resource limits, security best practices

### Prerequisites

- **Minikube** installed and configured
- **Helm 3.x** installed
- **kubectl** configured for Minikube
- **Docker** for building images
- **Environment Variables**:
  - `DATABASE_URL`: Neon PostgreSQL connection string
  - `BETTER_AUTH_SECRET`: Authentication secret
  - `OPENAI_API_KEY`: OpenAI API key (optional)
  - `JWT_SECRET_KEY`: JWT signing key (optional)

### Quick Start

#### One-Command Deployment (Linux/macOS)

```bash
# Set environment variables
export DATABASE_URL="postgresql://..."
export BETTER_AUTH_SECRET="your-secret"
export OPENAI_API_KEY="your-key"  # Optional
export JWT_SECRET_KEY="your-key"  # Optional

# Run deployment script
chmod +x scripts/deploy-minikube.sh
./scripts/deploy-minikube.sh
```

#### One-Command Deployment (Windows PowerShell)

```powershell
# Set environment variables
$env:DATABASE_URL = "postgresql://..."
$env:BETTER_AUTH_SECRET = "your-secret"
$env:OPENAI_API_KEY = "your-key"  # Optional
$env:JWT_SECRET_KEY = "your-key"  # Optional

# Run deployment script
.\scripts\deploy-minikube.ps1
```

#### Manual Deployment

1. **Start Minikube**
   ```bash
   minikube start --profile=todo-hackathon --cpus=4 --memory=8192
   eval $(minikube docker-env --profile=todo-hackathon)
   ```

2. **Build Docker Images**
   ```bash
   docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
   docker build -t todo-backend:latest -f backend/Dockerfile backend/
   ```

3. **Install Helm Charts**
   ```bash
   # Backend
   helm install todo-backend ./helm/todo-backend \
     --set secrets.databaseUrl="${DATABASE_URL}" \
     --set secrets.betterAuthSecret="${BETTER_AUTH_SECRET}" \
     --set secrets.openaiApiKey="${OPENAI_API_KEY}" \
     --set secrets.jwtSecretKey="${JWT_SECRET_KEY}"

   # Frontend
   helm install todo-frontend ./helm/todo-frontend \
     --set config.backendApiUrl="http://todo-backend:8000"
   ```

4. **Access Application**
   ```bash
   # Get NodePort
   NODE_IP=$(minikube ip --profile=todo-hackathon)
   NODE_PORT=$(kubectl get svc todo-frontend -o jsonpath='{.spec.ports[0].nodePort}')
   echo "Frontend URL: http://${NODE_IP}:${NODE_PORT}"
   ```

### AIOps with kubectl-ai and kagent

#### kubectl-ai Examples

```bash
# Deploy backend with natural language
kubectl-ai "deploy the todo backend with 2 replicas, using image todo-backend:latest, with 512Mi memory limit"

# Scale deployment
kubectl-ai "scale the todo-backend deployment to 5 replicas"

# Diagnose issues
kubectl-ai "why are the todo-backend pods restarting?"

# Troubleshoot connectivity
kubectl-ai "why can't the frontend connect to the backend service?"
```

#### kagent Examples

```bash
# Analyze cluster health
kagent analyze cluster --namespace default

# Analyze component health
kagent analyze component todo-backend

# Diagnose pod issues
kagent diagnose --pod todo-backend-*

# Get optimization recommendations
kagent optimize resources --deployment todo-backend

# Analyze why pods restarted
kagent analyze why backend pods restarted
```

### Verification

```bash
# Check pod status
kubectl get pods -l 'app in (todo-frontend,todo-backend)'

# Check services
kubectl get svc

# Check logs
kubectl logs -l app=todo-backend --tail=50

# Test health endpoint
kubectl exec -it $(kubectl get pod -l app=todo-backend -o jsonpath='{.items[0].metadata.name}') -- \
  curl http://localhost:8000/api/health
```

### Scaling

```bash
# Scale backend replicas
helm upgrade todo-backend ./helm/todo-backend --set replicaCount=5

# Or use kubectl-ai
kubectl-ai "scale todo-backend to 5 replicas for increased load"
```

### Cleanup

```bash
# Uninstall Helm charts
helm uninstall todo-frontend todo-backend

# Stop Minikube
minikube stop --profile=todo-hackathon

# Delete Minikube cluster
minikube delete --profile=todo-hackathon
```

### Spec-Driven Development

All Phase IV artifacts are generated from specifications:

- **Architecture**: `specs/architecture/kubernetes-overview.md`
- **Containerization**: `specs/deployment/containerization.md`
- **Helm Charts**: `specs/deployment/helm-chart.md`
- **Minikube**: `specs/deployment/minikube.md`
- **AIOps**: `specs/aiops/ai-operations.md`

See `.spec-kit/config.yaml` for the complete specification mapping.

### Production-Grade Features

- ✅ Multi-stage Docker builds for optimized images
- ✅ Non-root containers for security
- ✅ Health probes (liveness and readiness)
- ✅ Resource limits and requests
- ✅ ConfigMaps and Secrets separation
- ✅ Horizontal Pod Autoscaling ready
- ✅ Stateless backend design
- ✅ External database connectivity

### Next Steps: Phase V

This Kubernetes setup prepares for Phase V:
- **Kafka Integration**: Event-driven architecture
- **Dapr**: Distributed application runtime
- **DOKS**: DigitalOcean Kubernetes Service deployment
- **Advanced Observability**: Metrics, tracing, logging

## 🛠 Technology Stack

### Frontend
- **React 18+** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **CSS Modules** - Component-scoped styling
- **React Context API + useReducer** - State management
- **Axios** - HTTP client for API calls
- **Better Auth** - Authentication library

### Backend
- **FastAPI** - Modern Python web framework
- **SQLModel** - SQL database ORM
- **PostgreSQL (Neon)** - Cloud-native database
- **JWT (python-jose)** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **python-dotenv** - Environment variable management

### Server (Optional)
- **Node.js + Express** - Chat API server
- **MCP SDK** - Model Context Protocol server
- **TypeScript** - Type-safe server development

### Phase IV: Kubernetes & DevOps
- **Docker** - Containerization
- **Kubernetes (Minikube)** - Local cluster
- **Helm** - Package manager for Kubernetes
- **kubectl-ai** - AI-powered Kubernetes operations
- **kagent** - AI cluster health analysis

## 📁 Project Structure

- **frontend** – ChatKit-based UI
- **backend** – FastAPI + Agents SDK + MCP
- **specs** – Specification files for agent and MCP tools

```
Hackathon-2-Phase4/
├── .specify/              # Spec-driven development artifacts
│   ├── memory/
│   │   └── constitution.md    # Project principles and standards
│   ├── spec.md            # Project specifications
│   ├── plan.md            # Implementation plan
│   ├── data-model.md      # Data model definitions
│   └── tasks.md           # Task breakdown
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Auth/      # Authentication components
│   │   │   ├── Chatbot/   # Chatbot assistant
│   │   │   ├── FilterBar/ # Filter controls
│   │   │   ├── Footer/    # Footer component
│   │   │   ├── Header/    # Header component
│   │   │   ├── Landing/   # Landing/login page
│   │   │   ├── SearchBar/ # Search functionality
│   │   │   ├── TodoForm/  # Todo creation/editing form
│   │   │   ├── TodoItem/  # Individual todo item
│   │   │   └── TodoList/  # Todo list container
│   │   ├── context/       # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── TodoContext.tsx
│   │   │   └── ToastContext.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   │   └── useTodos.ts
│   │   ├── services/      # API services
│   │   │   └── api.ts
│   │   ├── styles/        # Global styles
│   │   │   ├── globals.css
│   │   │   └── toast.css
│   │   ├── types/         # TypeScript types
│   │   │   └── todo.ts
│   │   ├── utils/         # Utility functions
│   │   │   ├── chatParser.ts
│   │   │   ├── filters.ts
│   │   │   └── storage.ts
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Application entry point
│   ├── public/            # Static assets
│   │   ├── logo.png
│   │   └── cs.webp
│   ├── package.json
│   └── vite.config.ts
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── models/        # SQLModel models
│   │   ├── routes/        # API routes
│   │   ├── dependencies/  # Dependency injection
│   │   └── config.py      # Configuration
│   ├── api/
│   │   └── index.py       # API entry point
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables
├── server/                # Node.js chat API server (optional)
│   ├── src/
│   │   ├── index.ts       # Express server
│   │   ├── mcp-server.ts  # MCP server
│   │   ├── chat-service.ts # Chat service
│   │   └── api-client.ts  # Backend API client
│   └── package.json
├── helm/                  # Helm charts (Phase IV)
│   ├── todo-frontend/    # Frontend Helm chart
│   └── todo-backend/      # Backend Helm chart
├── specs/                 # Spec-Kit specifications (Phase IV)
│   ├── architecture/     # Architecture specs
│   ├── deployment/        # Deployment specs
│   └── aiops/            # AIOps specs
├── scripts/               # Deployment scripts (Phase IV)
│   ├── deploy-minikube.sh
│   └── deploy-minikube.ps1
├── .spec-kit/             # Spec-Kit configuration (Phase IV)
│   └── config.yaml
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.9+** and pip
- **PostgreSQL Database** (Neon recommended)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository** (if applicable)

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Install Server Dependencies** (Optional - for chat API)
   ```bash
   cd server
   npm install
   ```

### Environment Setup

1. **Backend Environment** (`backend/.env`)
   ```env
   DATABASE_URL=your_neon_postgresql_connection_string
   JWT_SECRET_KEY=your_secret_key_here
   JWT_ALGORITHM=HS256
   ```

2. **Frontend Environment** (`frontend/.env`)
   ```env
   VITE_BACKEND_API_URL=http://localhost:8000
   ```

3. **Server Environment** (`server/.env`) - Optional
   ```env
   BACKEND_API_URL=http://localhost:8000
   PORT=3001
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   python -m uvicorn api.index:app --reload --port 8000
   ```
   Backend will be available at `http://localhost:8000`

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

3. **Start Chat API Server** (Optional)
   ```bash
   cd server
   npm run dev
   ```
   Chat API will be available at `http://localhost:3001`

### Build for Production

**Frontend Build**
```bash
cd frontend
npm run build
```

**Preview Production Build**
```bash
cd frontend
npm run preview
```

## 🔄 Development Workflow

This project follows **Spec-Driven Development (SDD)** methodology as defined in `.specify/memory/constitution.md`:

1. **Constitution** ✅ - Project principles and standards defined
2. **Specification** ✅ - Requirements documented in `.specify/spec.md`
3. **Planning** ✅ - Technical plan in `.specify/plan.md`
4. **Data Model** ✅ - Data structures in `.specify/data-model.md`
5. **Tasks** ✅ - Task breakdown in `.specify/tasks.md`
6. **Implementation** ✅ - Code implementation complete

### Development Principles

- **Spec-Driven**: All features specified before implementation
- **Code Quality**: Clean code, self-documenting, consistent style
- **Testing**: High test coverage with clear, maintainable tests
- **Documentation**: Keep specifications and code comments up to date
- **User Experience**: Prioritize usability and responsive design
- **Performance**: Optimize for performance and scalability

## 💻 Usage

### Basic Operations

1. **Sign Up / Login**
   - Create an account or sign in to access your todos
   - Password must meet strength requirements (8+ chars, uppercase, lowercase, number, special char)

2. **Create a Todo**
   - Fill in the form with title (required), description, due date, and priority
   - Click "Add Todo" or use the chatbot: "Create a todo called [title]"

3. **Edit a Todo**
   - Click the "Edit" button on any todo item
   - Modify fields in the popup modal
   - Click "Update Todo" to save changes

4. **Complete a Todo**
   - Check the checkbox next to the todo title
   - Or use chatbot: "Complete the todo [title]"

5. **Delete a Todo**
   - Click the "Delete" button (red button)
   - Confirm deletion in the dialog
   - Or use chatbot: "Delete the todo [title]"

### Filtering & Sorting

- **Filter by Status**: All, Pending, Completed
- **Filter by Priority**: All, Low, Medium, High
- **Filter by Due Date**: All, Today, This Week, Overdue
- **Sort by**: Due Date, Priority, Creation Date, Title
- **Sort Order**: Ascending or Descending

### Search

- Type in the search bar to find todos by title or description
- Search is case-insensitive and updates in real-time

### Chatbot Assistant

Open the chatbot from the bottom-right corner and try:

- **Create**: "Create a todo called Buy groceries for the weekend party"
- **List**: "Show my todos" or "What are my todos"
- **Complete**: "Complete the todo Buy groceries"
- **Delete**: "Delete the todo Review documents"
- **Count**: "How many todos do I have"

The chatbot automatically generates detailed descriptions for all created tasks.

## 🏗 Architecture

### Frontend Architecture
```
React Components
    ↓
Context API (State Management)
    ↓
Custom Hooks (Business Logic)
    ↓
API Service (HTTP Client)
    ↓
Backend API (FastAPI)
    ↓
Neon PostgreSQL Database
```

### Authentication Flow
```
User Sign Up/Login
    ↓
JWT Token Generated
    ↓
Token Stored in localStorage
    ↓
Token Attached to API Requests
    ↓
Backend Validates Token
    ↓
Protected Routes Accessible
```

### Chatbot Flow
```
User Input (Natural Language)
    ↓
Chat Parser (Rule-based)
    ↓
Command Extraction
    ↓
API Service Calls
    ↓
Backend API
    ↓
Database Update
    ↓
UI Refresh
```

## 🧪 Testing

Run tests:
```bash
cd frontend
npm test
```

Run tests with UI:
```bash
cd frontend
npm run test:ui
```

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## 📝 License

This project is part of **Hackathon II - Phase IV** by **Roll # 00037391**.

## 🙏 Acknowledgments

- Built following Spec-Driven Development methodology
- Uses modern web technologies and best practices
- Designed with user experience and performance in mind

---

**For GIAIC Hackathon - 2 Phase IV by Roll # 00037391**
