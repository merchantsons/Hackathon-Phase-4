import axios, { AxiosInstance } from 'axios';
import { config } from './config.js';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  due_date?: string;
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

export class TodoApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.backend.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((request) => {
      if (this.authToken) {
        request.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return request;
    });
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.client.post('/api/auth/login', { email, password });
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  async register(email: string, password: string): Promise<any> {
    const response = await this.client.post('/api/auth/register', { email, password });
    return response.data;
  }

  async getTasks(): Promise<Task[]> {
    const response = await this.client.get('/api/tasks');
    return response.data;
  }

  async getTask(taskId: string | number): Promise<Task> {
    const response = await this.client.get(`/api/tasks/${taskId}`);
    return response.data;
  }

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await this.client.post('/api/tasks', task);
    return response.data;
  }

  async updateTask(taskId: string | number, updates: TaskUpdate): Promise<Task> {
    const response = await this.client.put(`/api/tasks/${taskId}`, updates);
    return response.data;
  }

  async deleteTask(taskId: string | number): Promise<void> {
    await this.client.delete(`/api/tasks/${taskId}`);
  }

  async completeTask(taskId: string | number): Promise<Task> {
    const response = await this.client.patch(`/api/tasks/${taskId}/complete`);
    return response.data;
  }
}

export const apiClient = new TodoApiClient();
