# How to Start the Chat Server

The chat server is required for the Todo Assistant (AI chatbot) to work.

## Quick Start

1. **Install dependencies** (if not already installed):
   ```bash
   cd server
   npm install
   ```

2. **Create `.env` file**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Or create it manually with:
   # OPENAI_API_KEY=your_openai_api_key_here
   # BACKEND_API_URL=http://localhost:8000
   # PORT=3001
   ```

3. **Set your OpenAI API Key**:
   - Get your API key from: https://platform.openai.com/api-keys
   - Edit `server/.env` and replace `your_openai_api_key_here` with your actual key

4. **Start the server**:
   ```bash
   npm run dev
   ```

5. **Verify it's running**:
   - You should see: `Chat API server running on port 3001`
   - Visit: http://localhost:3001/health
   - Should return: `{"status":"healthy","service":"todo-chat-api"}`

## Troubleshooting

### Port 3001 already in use
If you get an error that port 3001 is already in use:
- Change `PORT=3002` in `server/.env`
- Update `VITE_API_URL=http://localhost:3002` in `frontend/.env`

### Missing OpenAI API Key
- The server will start but chatbot won't work
- Get your API key from: https://platform.openai.com/api-keys
- Add it to `server/.env` as `OPENAI_API_KEY=sk-...`

### Backend not running
- Make sure the FastAPI backend is running on port 8000
- Start it with: `cd backend && python run.py`

## Required Services

For the Todo Assistant to work, you need:
1. ✅ **Chat Server** (port 3001) - `cd server && npm run dev`
2. ✅ **Backend API** (port 8000) - `cd backend && python run.py`
3. ✅ **Frontend** (port 5173) - `cd frontend && npm run dev`
