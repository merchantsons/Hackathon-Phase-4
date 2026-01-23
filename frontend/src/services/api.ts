import axios, { AxiosInstance } from 'axios';

// Get runtime config from window (injected by Kubernetes) or fall back to build-time env vars
const getRuntimeConfig = (key: string, defaultValue: string): string => {
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) {
    return (window as any).__RUNTIME_CONFIG__[key] || defaultValue;
  }
  return import.meta.env[key] || defaultValue;
};

const API_BASE_URL = getRuntimeConfig('VITE_API_URL', 'http://localhost:3001');
// Use local backend by default, but allow override via env variable or runtime config
const BACKEND_API_URL = getRuntimeConfig('VITE_BACKEND_API_URL', 'http://localhost:8000');

export interface Task {
  id: number | string;  // Backend returns number, frontend may use string
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  status?: 'pending' | 'completed';
}

class ApiService {
  private chatClient: AxiosInstance;
  private backendClient: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.chatClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for AI responses
    });

    this.backendClient = axios.create({
      baseURL: BACKEND_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load auth token from localStorage
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      this.setAuthToken(savedToken);
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
    this.backendClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('auth_token');
    delete this.backendClient.defaults.headers.common['Authorization'];
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.backendClient.post('/api/auth/login', { email, password });
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return {
      token: response.data.token,
      user: response.data.user || { email, id: response.data.user?.id },
    };
  }

  async register(email: string, password: string, name?: string) {
    const response = await this.backendClient.post('/api/auth/register', { 
      email, 
      password,
      name: name || undefined,
    });
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return {
      token: response.data.token,
      user: response.data.user || { email, name: name || email.split('@')[0], id: response.data.user?.id },
    };
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    const response = await this.backendClient.get('/api/tasks');
    return response.data;
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await this.backendClient.get(`/api/tasks/${taskId}`);
    return response.data;
  }

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await this.backendClient.post('/api/tasks', task);
    return response.data;
  }

  async updateTask(taskId: string | number, updates: TaskUpdate): Promise<Task> {
    const response = await this.backendClient.put(`/api/tasks/${taskId}`, updates);
    return response.data;
  }

  async deleteTask(taskId: string | number): Promise<void> {
    await this.backendClient.delete(`/api/tasks/${taskId}`);
  }

  async completeTask(taskId: string | number): Promise<Task> {
    const response = await this.backendClient.patch(`/api/tasks/${taskId}/complete`);
    return response.data;
  }

  // Chat methods
  async sendChatMessage(
    message: string,
    conversationId?: string
  ): Promise<{ response: string; conversationId: string }> {
    // Ensure we have the latest auth token from localStorage
    const currentToken = localStorage.getItem('auth_token') || this.authToken;
    
    if (!currentToken) {
      throw new Error('Authentication required. Please sign in to use the Todo Assistant.');
    }

    const response = await this.chatClient.post('/api/chat', {
      message,
      conversationId,
      authToken: currentToken,
    });
    return response.data;
  }

  async getConversation(conversationId: string) {
    const response = await this.chatClient.get(`/api/chat/${conversationId}`);
    return response.data;
  }

  async deleteConversation(conversationId: string) {
    await this.chatClient.delete(`/api/chat/${conversationId}`);
  }
}

export const apiService = new ApiService();
