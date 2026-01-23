import { apiClient } from './api-client.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ConversationState {
  conversationId: string;
  messages: ChatMessage[];
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for conversation state
const conversationStore = new Map<string, ConversationState>();

export class ChatService {
  private getOrCreateConversation(conversationId: string): ConversationState {
    if (!conversationStore.has(conversationId)) {
      const now = new Date().toISOString();
      conversationStore.set(conversationId, {
        conversationId,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Todo Assistant.',
          },
        ],
        createdAt: now,
        updatedAt: now,
      });
    }
    return conversationStore.get(conversationId)!;
  }

  private parseCommand(message: string): {
    action: string;
    taskTitle?: string;
    taskId?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    description?: string;
  } {
    const lowerMessage = message.toLowerCase().trim();

    // Extract priority
    let priority: 'low' | 'medium' | 'high' | undefined;
    if (lowerMessage.includes('high priority') || lowerMessage.includes('high-priority')) {
      priority = 'high';
    } else if (lowerMessage.includes('low priority') || lowerMessage.includes('low-priority')) {
      priority = 'low';
    } else if (lowerMessage.includes('medium priority') || lowerMessage.includes('medium-priority')) {
      priority = 'medium';
    }

    // Extract due date patterns
    let dueDate: string | undefined;
    const datePatterns = [
      /due\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})/i,
      /due\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})/i,
      /(\d{4}-\d{2}-\d{2})/,
    ];
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            dueDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          // Ignore date parsing errors
        }
      }
    }

    // Parse actions
    if (lowerMessage.match(/^(show|list|display|get|what are|what's).*(?:todo|task|todos|tasks)/) ||
        lowerMessage.match(/(?:show|list|display|get).*(?:my|all).*(?:todo|task|todos|tasks)/)) {
      return { action: 'list' };
    }

    if (lowerMessage.match(/^(create|add|new|make).*(?:todo|task)/) ||
        lowerMessage.match(/(?:create|add|new|make).*(?:a|an).*(?:todo|task)/)) {
      // Extract task title
      const titleMatch = message.match(/(?:called|named|titled|title:)\s+["']?([^"']+)["']?/i) ||
                        message.match(/(?:create|add|new|make).*(?:todo|task).*(?:called|named|titled)?\s+["']?([^"'.!?]+)["']?/i);
      const taskTitle = titleMatch ? titleMatch[1].trim() : message.replace(/^(create|add|new|make).*(?:todo|task).*(?:called|named|titled)?/i, '').trim().replace(/["']/g, '').split(/[.!?]/)[0].trim();
      
      // Extract description
      const descMatch = message.match(/description[:\s]+["']?([^"']+)["']?/i);
      const description = descMatch ? descMatch[1].trim() : undefined;

      return {
        action: 'create',
        taskTitle: taskTitle || 'New Task',
        priority,
        dueDate,
        description,
      };
    }

    if (lowerMessage.match(/^(complete|finish|done|mark.*done|mark.*complete)/) ||
        lowerMessage.match(/(?:complete|finish|done|mark).*(?:todo|task)/)) {
      // Extract task title or ID
      const taskMatch = message.match(/(?:todo|task).*["']?([^"'.!?]+)["']?/i) ||
                       message.match(/(?:complete|finish|done|mark).*["']?([^"'.!?]+)["']?/i);
      const taskTitle = taskMatch ? taskMatch[1].trim() : undefined;
      return { action: 'complete', taskTitle };
    }

    if (lowerMessage.match(/^(delete|remove|erase)/) ||
        lowerMessage.match(/(?:delete|remove|erase).*(?:todo|task)/)) {
      const taskMatch = message.match(/(?:todo|task).*["']?([^"'.!?]+)["']?/i) ||
                       message.match(/(?:delete|remove|erase).*["']?([^"'.!?]+)["']?/i);
      const taskTitle = taskMatch ? taskMatch[1].trim() : undefined;
      return { action: 'delete', taskTitle };
    }

    if (lowerMessage.match(/^(update|edit|change|modify)/) ||
        lowerMessage.match(/(?:update|edit|change|modify).*(?:todo|task)/)) {
      const taskMatch = message.match(/(?:todo|task).*["']?([^"'.!?]+)["']?/i) ||
                       message.match(/(?:update|edit|change|modify).*["']?([^"'.!?]+)["']?/i);
      const taskTitle = taskMatch ? taskMatch[1].trim() : undefined;
      return { action: 'update', taskTitle, priority, dueDate };
    }

    if (lowerMessage.match(/^(count|how many)/) ||
        lowerMessage.match(/(?:count|how many).*(?:todo|task)/)) {
      return { action: 'count' };
    }

    if (lowerMessage.match(/^(help|what can you do)/i)) {
      return { action: 'help' };
    }

    return { action: 'unknown' };
  }

  async processMessage(
    conversationId: string,
    userMessage: string,
    authToken?: string
  ): Promise<{ response: string; conversationId: string }> {
    // Set auth token if provided
    if (authToken) {
      apiClient.setAuthToken(authToken);
    }

    const conversation = this.getOrCreateConversation(conversationId);

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const command = this.parseCommand(userMessage);
      let response = '';

      switch (command.action) {
        case 'list': {
          const tasks = await apiClient.getTasks();
          if (tasks.length === 0) {
            response = "You don't have any tasks yet. Create one to get started!";
          } else {
            const taskList = tasks.map((task, index) => {
              const status = task.status === 'completed' ? '✓' : '○';
              const priority = task.priority ? ` [${task.priority}]` : '';
              const dueDate = task.due_date ? ` (due: ${task.due_date})` : '';
              return `${index + 1}. ${status} ${task.title}${priority}${dueDate}`;
            }).join('\n');
            response = `Here are your tasks:\n\n${taskList}`;
          }
          break;
        }

        case 'create': {
          if (!command.taskTitle || command.taskTitle === 'New Task') {
            response = "I'd be happy to create a task for you! Please tell me what the task should be called.";
          } else {
            try {
              const task = await apiClient.createTask({
                title: command.taskTitle,
                description: command.description,
                priority: command.priority || 'medium',
                due_date: command.dueDate,
              });
              response = `✅ Created task: "${task.title}"${command.priority ? ` (${command.priority} priority)` : ''}${command.dueDate ? ` due on ${command.dueDate}` : ''}`;
            } catch (error: any) {
              response = `Sorry, I couldn't create the task: ${error.message || 'Unknown error'}`;
            }
          }
          break;
        }

        case 'complete': {
          try {
            const tasks = await apiClient.getTasks();
            const pendingTasks = tasks.filter(t => t.status === 'pending');
            
            if (pendingTasks.length === 0) {
              response = "You don't have any pending tasks to complete.";
            } else if (command.taskTitle) {
              // Try to find task by title
              const task = pendingTasks.find(t => 
                t.title.toLowerCase().includes(command.taskTitle!.toLowerCase())
              );
              if (task) {
                await apiClient.completeTask(task.id);
                response = `✅ Completed task: "${task.title}"`;
              } else {
                response = `I couldn't find a pending task matching "${command.taskTitle}". Here are your pending tasks:\n${pendingTasks.map(t => `- ${t.title}`).join('\n')}`;
              }
            } else {
              // Complete the first pending task
              const task = pendingTasks[0];
              await apiClient.completeTask(task.id);
              response = `✅ Completed task: "${task.title}"`;
            }
          } catch (error: any) {
            response = `Sorry, I couldn't complete the task: ${error.message || 'Unknown error'}`;
          }
          break;
        }

        case 'delete': {
          try {
            const tasks = await apiClient.getTasks();
            
            if (tasks.length === 0) {
              response = "You don't have any tasks to delete.";
            } else if (command.taskTitle) {
              // Try to find task by title
              const task = tasks.find(t => 
                t.title.toLowerCase().includes(command.taskTitle!.toLowerCase())
              );
              if (task) {
                await apiClient.deleteTask(task.id);
                response = `✅ Deleted task: "${task.title}"`;
              } else {
                response = `I couldn't find a task matching "${command.taskTitle}". Here are your tasks:\n${tasks.map(t => `- ${t.title}`).join('\n')}`;
              }
            } else {
              response = "Please specify which task you'd like to delete. For example: 'Delete the todo Buy groceries'";
            }
          } catch (error: any) {
            response = `Sorry, I couldn't delete the task: ${error.message || 'Unknown error'}`;
          }
          break;
        }

        case 'update': {
          response = "Update functionality is coming soon! For now, you can use the edit button in the UI.";
          break;
        }

        case 'count': {
          try {
            const tasks = await apiClient.getTasks();
            const pending = tasks.filter(t => t.status === 'pending').length;
            const completed = tasks.filter(t => t.status === 'completed').length;
            response = `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''} total (${pending} pending, ${completed} completed).`;
          } catch (error: any) {
            response = `Sorry, I couldn't count your tasks: ${error.message || 'Unknown error'}`;
          }
          break;
        }

        case 'help': {
          response = `I can help you manage your tasks! Here's what I can do:

• **List tasks**: "Show my todos", "List all tasks"
• **Create task**: "Create a todo called Buy groceries", "Add a high priority task Finish report"
• **Complete task**: "Complete the todo Buy groceries", "Mark Buy groceries as done"
• **Delete task**: "Delete the todo Buy groceries"
• **Count tasks**: "How many todos do I have"

Try saying something like "Create a todo called Buy groceries" or "Show my todos"!`;
          break;
        }

        default: {
          response = `I'm not sure what you mean. Try saying:
• "Show my todos" - to see all your tasks
• "Create a todo called [name]" - to create a new task
• "Complete the todo [name]" - to mark a task as done
• "Delete the todo [name]" - to delete a task
• "Help" - to see all available commands`;
        }
      }

      // Add assistant response to conversation
      conversation.messages.push({
        role: 'assistant',
        content: response,
      });

      conversation.updatedAt = new Date().toISOString();

      return {
        response,
        conversationId,
      };
    } catch (error: any) {
      console.error('Chat service error:', error);
      const errorMessage =
        error.message || 'I apologize, but I encountered an error. Please try again.';
      conversation.messages.push({
        role: 'assistant',
        content: errorMessage,
      });
      return {
        response: errorMessage,
        conversationId,
      };
    }
  }

  getConversation(conversationId: string): ConversationState | null {
    return conversationStore.get(conversationId) || null;
  }

  deleteConversation(conversationId: string): boolean {
    return conversationStore.delete(conversationId);
  }
}

export const chatService = new ChatService();
