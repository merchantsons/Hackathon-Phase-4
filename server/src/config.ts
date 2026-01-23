import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  backend: {
    apiUrl: process.env.BACKEND_API_URL || 'http://localhost:8000',
    apiKey: process.env.BACKEND_API_KEY,
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    mcpPort: parseInt(process.env.MCP_PORT || '3002', 10),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
};

// Note: OpenAI is not required - using rule-based chatbot instead
// OPENAI_API_KEY is optional and not used
