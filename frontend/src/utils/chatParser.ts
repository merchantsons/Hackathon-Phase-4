import { apiService } from '../services/api';

interface ParsedCommand {
  action: string;
  taskTitle?: string;
  taskId?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  description?: string;
}

function normalizeTaskTitle(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let title = raw.trim();
  // Remove surrounding quotes
  title = title.replace(/^["']+|["']+$/g, '').trim();
  // Remove trailing punctuation
  title = title.replace(/[.!?,;:]+$/g, '').trim();
  // Remove leading articles + nouns
  title = title.replace(/^(the|a|an)\s+/i, '').trim();
  title = title.replace(/^(todo|task)\s+/i, '').trim();
  // Collapse whitespace
  title = title.replace(/\s+/g, ' ').trim();
  return title.length >= 2 ? title : undefined;
}

function stripCompletionSuffix(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let title = raw;
  // Remove common completion suffixes
  title = title.replace(/\s+(?:as\s+)?(?:done|complete|completed)\s*$/i, '').trim();
  title = title.replace(/\s+is\s+(?:done|complete|completed)\s*$/i, '').trim();
  return normalizeTaskTitle(title);
}

export function parseCommand(message: string): ParsedCommand {
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
    // First, extract explicit description if present (to exclude it from title)
    let description: string | undefined;
    const descPatterns = [
      /description[:\s]+["']?([^"']+)["']?/i,
      /desc[:\s]+["']?([^"']+)["']?/i,
      /(?:with\s+description|about|for|regarding)[:\s]+["']?([^"']+)["']?/i,
    ];
    
    for (const pattern of descPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        description = match[1].trim();
        break;
      }
    }
    
    // Extract task title - look for "called", "named", "titled", or after the action
    let taskTitle = '';
    
    // Remove description part from message for title extraction
    let messageForTitle = message;
    if (description) {
      messageForTitle = message.replace(new RegExp(`(?:description|desc)[:\\s]+["']?${description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?`, 'i'), '').trim();
    }
    
    const titlePatterns = [
      /(?:called|named|titled|title:)\s+["']?([^"']+?)["']?(?:\s|$|,|\.|description|due|priority)/i,
      /(?:create|add|new|make).*(?:todo|task).*(?:called|named|titled)?\s+["']?([^"'.!?]+?)["']?(?:\s|$|,|\.|description|due|priority)/i,
    ];
    
    for (const pattern of titlePatterns) {
      const match = messageForTitle.match(pattern);
      if (match && match[1]) {
        taskTitle = match[1].trim();
        break;
      }
    }
    
    // If no title found with patterns, extract everything after action words
    if (!taskTitle) {
      // Remove action words and "todo/task" keywords
      let afterAction = messageForTitle
        .replace(/^(create|add|new|make)\s+(?:a|an)?\s*(?:todo|task)\s*(?:called|named|titled)?/i, '')
        .trim();
      
      // Remove priority and due date keywords
      afterAction = afterAction
        .replace(/(?:high|medium|low)\s+priority/gi, '')
        .replace(/priority[:\s]+(?:high|medium|low)/gi, '')
        .replace(/due[:\s]+[^"']+/gi, '')
        .trim();
      
      // If description was explicitly found, split title and description
      if (description) {
        // Title is everything before description keywords
        const descKeywordIndex = afterAction.toLowerCase().search(/(?:description|desc|with|about|for|regarding)/i);
        if (descKeywordIndex > 0) {
          taskTitle = afterAction.substring(0, descKeywordIndex).trim().replace(/["']/g, '');
        } else {
          taskTitle = afterAction.split(/[.!?]/)[0].trim().replace(/["']/g, '');
        }
      } else {
        // Try to intelligently split title and description
        // Look for natural separators: "and", "then", "also", comma followed by longer text
        const separators = [/\s+and\s+/i, /\s+then\s+/i, /\s+also\s+/i, /,\s+(?=[A-Z])/];
        let foundSeparator = false;
        
        for (const separator of separators) {
          const parts = afterAction.split(separator);
          if (parts.length > 1 && parts[0].trim().length > 3 && parts[1].trim().length > 5) {
            taskTitle = parts[0].trim().replace(/["']/g, '');
            description = parts.slice(1).join(' ').trim().replace(/["']/g, '').split(/[.!?]/)[0].trim();
            foundSeparator = true;
            break;
          }
        }
        
        if (!foundSeparator) {
          // If message is long enough, split at a reasonable point
          const words = afterAction.split(/\s+/);
          if (words.length > 8) {
            // Use first 5-7 words as title, rest as description
            const titleWords = words.slice(0, Math.min(7, Math.floor(words.length * 0.6)));
            const descWords = words.slice(titleWords.length);
            taskTitle = titleWords.join(' ').replace(/["']/g, '').trim();
            description = descWords.join(' ').replace(/["']/g, '').trim();
          } else {
            // Short message - use as title, no description
            taskTitle = afterAction.replace(/["']/g, '').split(/[.!?]/)[0].trim();
          }
        }
      }
    }
    
    // Clean up title - remove trailing commas, and/or
    taskTitle = taskTitle.replace(/[,;]\s*$/, '').replace(/\s+(and|or|the|a|an)\s*$/i, '').trim();
    
    // If still no description and there's more context, try to extract it
    if (!description) {
      const titleIndex = message.toLowerCase().indexOf(taskTitle.toLowerCase());
      if (titleIndex !== -1) {
        let afterTitle = message.substring(titleIndex + taskTitle.length).trim();
        // Remove priority and due date info
        afterTitle = afterTitle
          .replace(/(?:high|medium|low)\s+priority/gi, '')
          .replace(/priority[:\s]+(?:high|medium|low)/gi, '')
          .replace(/due[:\s]+[^"']+/gi, '')
          .trim();
        
        // If there's meaningful text left (more than 10 chars), use it as description
        if (afterTitle.length > 10) {
          // Remove common connecting words at start
          afterTitle = afterTitle.replace(/^(and|or|the|a|an|to|for|with|about)\s+/i, '');
          if (afterTitle.length > 10) {
            description = afterTitle.split(/[.!?]/)[0].trim();
          }
        }
      }
    }
    
    // Clean up description but keep it if it has any meaningful content
    if (description) {
      description = description.replace(/^[,;]\s*/, '').trim();
      // Only remove if it's truly meaningless
      if (description.length < 3 || /^(and|or|the|a|an|to|for|with|about)$/i.test(description)) {
        description = undefined;
      }
    }
    
    // Always ensure we have a description - will be enhanced in the create case
    // If no description found, we'll create one based on the title

    return {
      action: 'create',
      taskTitle: taskTitle || 'New Task',
      priority,
      dueDate,
      description, // May be undefined, will be created/enhanced in create case
    };
  }

  if (lowerMessage.match(/^(complete|finish|done|mark.*done|mark.*complete)/) ||
      lowerMessage.match(/(?:complete|finish|done|mark).*(?:todo|task)/)) {
    // Extract task title more accurately - get the full title
    let taskTitle: string | undefined;

    // Pattern A: "mark <title> as done/complete"
    const markAsDone = message.match(/^\s*mark\s+["']?(.+?)["']?\s+(?:as\s+)?(?:done|complete|completed)\s*$/i);
    if (markAsDone?.[1]) {
      taskTitle = stripCompletionSuffix(markAsDone[1]);
    }

    // Pattern B: "<complete|finish> (the) (todo|task) <title>"
    if (!taskTitle) {
      const afterNoun = message.match(/(?:complete|finish)\s+(?:the\s+)?(?:todo|task)\s+["']?(.+?)["']?(?:[.!?,;]|$)/i);
      if (afterNoun?.[1]) taskTitle = stripCompletionSuffix(afterNoun[1]);
    }

    // Pattern C: "<complete|finish|done|mark> <title>" (fallback)
    if (!taskTitle) {
      const afterVerb = message.match(/^(?:complete|finish|done|mark)\s+["']?(.+?)["']?(?:[.!?,;]|$)/i);
      if (afterVerb?.[1]) taskTitle = stripCompletionSuffix(afterVerb[1]);
    }

    return { action: 'complete', taskTitle };
  }

  if (lowerMessage.match(/^(delete|remove|erase)/) ||
      lowerMessage.match(/(?:delete|remove|erase).*(?:todo|task)/)) {
    // Extract task title more accurately (similar to complete)
    let taskTitle: string | undefined;

    // Pattern A: "<delete|remove|erase> (the) (todo|task) <title>"
    const afterNoun = message.match(/(?:delete|remove|erase)\s+(?:the\s+)?(?:todo|task)\s+["']?(.+?)["']?(?:[.!?,;]|$)/i);
    if (afterNoun?.[1]) {
      taskTitle = normalizeTaskTitle(afterNoun[1]);
    }

    // Pattern B: "<delete|remove|erase> <title>" (fallback)
    if (!taskTitle) {
      const afterVerb = message.match(/^(?:delete|remove|erase)\s+["']?(.+?)["']?(?:[.!?,;]|$)/i);
      if (afterVerb?.[1]) {
        taskTitle = normalizeTaskTitle(afterVerb[1]);
      }
    }

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

export async function processChatCommand(
  message: string,
  todos: any[]
): Promise<string> {
  const command = parseCommand(message);

  try {
    switch (command.action) {
      case 'list': {
        if (todos.length === 0) {
          return "You don't have any tasks yet. Create one to get started!";
        } else {
          const taskList = todos.map((task, index) => {
            const status = task.status === 'completed' ? '✓' : '○';
            const priority = task.priority ? ` [${task.priority}]` : '';
            const dueDate = task.dueDate ? ` (due: ${new Date(task.dueDate).toLocaleDateString()})` : '';
            return `${index + 1}. ${status} ${task.title}${priority}${dueDate}`;
          }).join('\n');
          return `Here are your tasks:\n\n${taskList}`;
        }
      }

      case 'create': {
        if (!command.taskTitle || command.taskTitle === 'New Task') {
          return "I'd be happy to create a task for you! Please tell me what the task should be called and provide some details about it.";
        } else {
          try {
            // Ensure description is always present and detailed (minimum 50 characters)
            let description = command.description;
            
            // If no description or too short, create a comprehensive one
            if (!description || description.length < 50) {
              // Create a detailed description based on the title
              const titleWords = command.taskTitle.split(/\s+/).filter(w => w.length > 2);
              
              if (titleWords.length > 0) {
                // Build a comprehensive description
                const context = titleWords.slice(1).join(' ');
                
                description = `This task involves ${command.taskTitle.toLowerCase()}. `;
                
                if (context) {
                  description += `The task requires attention to: ${context}. `;
                }
                
                if (command.description && command.description.length > 10) {
                  description += `Additional details: ${command.description}. `;
                }
                
                // Add comprehensive instructions
                description += `Please ensure all related activities are completed thoroughly. Review all requirements, verify completion criteria, and ensure everything is done properly before marking this task as complete.`;
              } else {
                description = `Task: ${command.taskTitle}. This is an important task that needs to be completed. Please review all requirements carefully, ensure everything is done properly, verify completion criteria, and check all details before marking as done.`;
              }
            } else {
              // Enhance existing description to make it more comprehensive
              if (!description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
                description += '.';
              }
              description += ` Please ensure this task is completed thoroughly, all requirements are met, verify completion criteria, and check all details before marking as complete.`;
            }
            
            await apiService.createTask({
              title: command.taskTitle,
              description: description,
              priority: command.priority || 'medium',
              due_date: command.dueDate,
            });
            let response = `✅ Created task: "${command.taskTitle}"`;
            response += `\nDescription: ${description}`;
            if (command.priority) {
              response += `\nPriority: ${command.priority}`;
            }
            if (command.dueDate) {
              response += `\nDue date: ${command.dueDate}`;
            }
            return response;
          } catch (error: any) {
            return `Sorry, I couldn't create the task: ${error.message || 'Unknown error'}`;
          }
        }
      }

      case 'complete': {
        try {
          const pendingTasks = todos.filter(t => t.status === 'pending');
          
          if (pendingTasks.length === 0) {
            return "You don't have any pending tasks to complete.";
          } else if (command.taskTitle && command.taskTitle.length >= 2) {
            // Use flexible matching
            const searchTitle = command.taskTitle.toLowerCase().trim();
            
            // First try exact match
            let task = pendingTasks.find(t => 
              t.title.toLowerCase().trim() === searchTitle
            );
            
            // Then try contains match
            if (!task) {
              task = pendingTasks.find(t => 
                t.title.toLowerCase().includes(searchTitle) ||
                searchTitle.includes(t.title.toLowerCase())
              );
            }
            
            // Then try word-by-word matching
            if (!task && searchTitle.split(/\s+/).length > 0) {
              const searchWords = searchTitle.split(/\s+/).filter(w => w.length > 1);
              task = pendingTasks.find(t => {
                const taskWords = t.title.toLowerCase().split(/\s+/);
                const matches = searchWords.filter(sw => 
                  taskWords.some((tw: string) => tw.includes(sw) || sw.includes(tw))
                ).length;
                return matches >= Math.ceil(searchWords.length * 0.5);
              });
            }
            
            if (task) {
              await apiService.completeTask(task.id);
              return `✅ Completed task: "${task.title}"`;
            } else {
              const taskList = pendingTasks.map(t => `- ${t.title}${t.description ? ` (${t.description})` : ''}`).join('\n');
              return `I couldn't find a pending task matching "${command.taskTitle}". Here are your pending tasks:\n${taskList}`;
            }
          } else {
            const task = pendingTasks[0];
            await apiService.completeTask(task.id);
            return `✅ Completed task: "${task.title}"`;
          }
        } catch (error: any) {
          return `Sorry, I couldn't complete the task: ${error.message || 'Unknown error'}`;
        }
      }

      case 'delete': {
        try {
          if (todos.length === 0) {
            return "You don't have any tasks to delete.";
          } else if (command.taskTitle && command.taskTitle.length >= 2) {
            // Use same flexible matching as complete
            const searchTitle = command.taskTitle.toLowerCase().trim();
            
            let task = todos.find(t => 
              t.title.toLowerCase().trim() === searchTitle
            );
            
            if (!task) {
              task = todos.find(t => 
                t.title.toLowerCase().includes(searchTitle) ||
                searchTitle.includes(t.title.toLowerCase())
              );
            }
            
            if (!task && searchTitle.split(/\s+/).length > 0) {
              const searchWords = searchTitle.split(/\s+/).filter(w => w.length > 1);
              task = todos.find(t => {
                const taskWords = t.title.toLowerCase().split(/\s+/);
                const matches = searchWords.filter(sw => 
                  taskWords.some((tw: string) => tw.includes(sw) || sw.includes(tw))
                ).length;
                return matches >= Math.ceil(searchWords.length * 0.5);
              });
            }
            
            if (task) {
              await apiService.deleteTask(task.id);
              return `✅ Deleted task: "${task.title}"`;
            } else {
              const taskList = todos.map(t => `- ${t.title}${t.description ? ` (${t.description})` : ''}`).join('\n');
              return `I couldn't find a task matching "${command.taskTitle}". Here are your tasks:\n${taskList}`;
            }
          } else {
            return "Please specify which task you'd like to delete. For example: 'Delete the todo Buy groceries'";
          }
        } catch (error: any) {
          return `Sorry, I couldn't delete the task: ${error.message || 'Unknown error'}`;
        }
      }

      case 'update': {
        return "Update functionality is coming soon! For now, you can use the edit button in the UI.";
      }

      case 'count': {
        const pending = todos.filter(t => t.status === 'pending').length;
        const completed = todos.filter(t => t.status === 'completed').length;
        return `You have ${todos.length} task${todos.length !== 1 ? 's' : ''} total (${pending} pending, ${completed} completed).`;
      }

      case 'help': {
        return `I can help you manage your tasks! Here's what I can do:

• **List tasks**: "Show my todos", "List all tasks"
• **Create task** (with detailed title and description): 
  - "Create a todo called Buy groceries for the weekend party"
  - "Add a todo Finish quarterly project report and submit to manager"
  - "Create a high priority todo Schedule client meeting for next week and prepare agenda"
  - "Add todo Review all project documents and provide detailed feedback"
• **Complete task**: "Complete the todo Buy groceries", "Mark Buy groceries as done"
• **Delete task**: "Delete the todo Buy groceries"
• **Count tasks**: "How many todos do I have"

I'll automatically extract detailed titles and descriptions from your messages!`;
      }

      default: {
        return `I'm not sure what you mean. Try saying:
• "Show my todos" - to see all your tasks
• "Create a todo called [name]" - to create a new task
• "Complete the todo [name]" - to mark a task as done
• "Delete the todo [name]" - to delete a task
• "Help" - to see all available commands`;
      }
    }
  } catch (error: any) {
    return `I apologize, but I encountered an error: ${error.message || 'Unknown error'}`;
  }
}
