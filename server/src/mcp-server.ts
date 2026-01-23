#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { apiClient } from './api-client.js';
import { config } from './config.js';

class TodoMCPServer {
  private server: Server;
  private tools: Tool[];

  constructor() {
    this.server = new Server(
      {
        name: 'todo-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupHandlers();
  }

  private setupTools() {
    this.tools = [
      {
        name: 'list_tasks',
        description: 'List all tasks. Returns all tasks for the authenticated user.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_task',
        description: 'Get a specific task by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The ID of the task to retrieve',
            },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task. All fields except title are optional.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the task (required)',
            },
            description: {
              type: 'string',
              description: 'Optional description of the task',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Priority level of the task',
            },
            due_date: {
              type: 'string',
              description: 'Due date in ISO format (YYYY-MM-DD)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'update_task',
        description: 'Update an existing task. All fields are optional.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The ID of the task to update',
            },
            title: {
              type: 'string',
              description: 'New title for the task',
            },
            description: {
              type: 'string',
              description: 'New description for the task',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'New priority level',
            },
            due_date: {
              type: 'string',
              description: 'New due date in ISO format (YYYY-MM-DD)',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed'],
              description: 'New status of the task',
            },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'delete_task',
        description: 'Delete a task by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The ID of the task to delete',
            },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The ID of the task to mark as completed',
            },
          },
          required: ['task_id'],
        },
      },
    ];
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_tasks': {
            const tasks = await apiClient.getTasks();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tasks, null, 2),
                },
              ],
            };
          }

          case 'get_task': {
            const task = await apiClient.getTask(args.task_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(task, null, 2),
                },
              ],
            };
          }

          case 'create_task': {
            const newTask = await apiClient.createTask({
              title: args.title as string,
              description: args.description as string | undefined,
              priority: args.priority as 'low' | 'medium' | 'high' | undefined,
              due_date: args.due_date as string | undefined,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(newTask, null, 2),
                },
              ],
            };
          }

          case 'update_task': {
            const updatedTask = await apiClient.updateTask(args.task_id as string, {
              title: args.title as string | undefined,
              description: args.description as string | undefined,
              priority: args.priority as 'low' | 'medium' | 'high' | undefined,
              due_date: args.due_date as string | undefined,
              status: args.status as 'pending' | 'completed' | undefined,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updatedTask, null, 2),
                },
              ],
            };
          }

          case 'delete_task': {
            await apiClient.deleteTask(args.task_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success: true, message: 'Task deleted successfully' }),
                },
              ],
            };
          }

          case 'complete_task': {
            const completedTask = await apiClient.completeTask(args.task_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(completedTask, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message || 'An error occurred',
                details: error.response?.data || error,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Todo MCP Server running on stdio');
  }
}

// Run the server
const server = new TodoMCPServer();
server.run().catch(console.error);
