# Todo MCP Server and Chat API

This server provides:
1. **MCP Server** - Model Context Protocol server that exposes todo operations as tools
2. **Chat API** - Stateless chat endpoint with OpenAI Agents SDK integration

## Features

- ✅ MCP server with task operation tools
- ✅ OpenAI Agents SDK integration
- ✅ Stateless chat endpoint
- ✅ Conversation state persistence (in-memory, can be extended to database)
- ✅ Integration with FastAPI backend

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
OPENAI_API_KEY=your_openai_api_key_here
BACKEND_API_URL=https://fastapi-vert-omega.vercel.app
PORT=3001
```

## Running

### Development Mode

Run the chat API server:
```bash
npm run dev
```

Run the MCP server:
```bash
npm run mcp
```

### Production Mode

Build:
```bash
npm run build
```

Start:
```bash
npm start
```

## API Endpoints

### Chat API

- `POST /api/chat` - Send a chat message
  ```json
  {
    "message": "Create a todo called Buy groceries",
    "conversationId": "optional-conversation-id",
    "authToken": "optional-auth-token"
  }
  ```

- `GET /api/chat/:conversationId` - Get conversation history

- `DELETE /api/chat/:conversationId` - Delete conversation

### Health Check

- `GET /health` - Health check endpoint

## MCP Server

The MCP server exposes the following tools:

- `list_tasks` - List all tasks
- `get_task` - Get a specific task by ID
- `create_task` - Create a new task
- `update_task` - Update an existing task
- `delete_task` - Delete a task
- `complete_task` - Mark a task as completed

## Architecture

```
Frontend (React)
    ↓
Chat API (Express + OpenAI Agents SDK)
    ↓
Backend API (FastAPI)
    ↓
Database (Neon PostgreSQL)
```

The MCP server can be used independently or integrated with the chat service.

## Notes

- Conversation state is currently stored in-memory. For production, implement database persistence.
- The MCP server uses stdio transport by default.
- Authentication tokens are passed through the chat API to the backend.
