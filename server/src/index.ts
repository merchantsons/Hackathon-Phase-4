import express from 'express';
import cors from 'cors';
import { chatService } from './chat-service.js';
import { config } from './config.js';

const app = express();

// CORS configuration - allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'todo-chat-api' });
});

// Chat endpoint - stateless with conversation state persistence
app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, authToken } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate conversation ID if not provided
    const convId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Process message
    const result = await chatService.processMessage(convId, message, authToken);

    res.json({
      conversationId: result.conversationId,
      response: result.response,
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Get conversation history
app.get('/api/chat/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const conversation = chatService.getConversation(conversationId);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  res.json(conversation);
});

// Delete conversation
app.delete('/api/chat/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const deleted = chatService.deleteConversation(conversationId);

  if (!deleted) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  res.json({ success: true });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'todo-chat-api',
    endpoints: {
      health: '/health',
      chat: 'POST /api/chat',
      getConversation: 'GET /api/chat/:conversationId',
      deleteConversation: 'DELETE /api/chat/:conversationId'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      health: 'GET /health',
      chat: 'POST /api/chat',
      getConversation: 'GET /api/chat/:conversationId',
      deleteConversation: 'DELETE /api/chat/:conversationId'
    }
  });
});

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Chat API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Chat endpoint: http://localhost:${PORT}/api/chat`);
});
