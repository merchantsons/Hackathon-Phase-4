import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTodos } from '../../hooks/useTodos';
import { apiService } from '../../services/api';
import { processChatCommand } from '../../utils/chatParser';
import chatbotIcon from '../../public/cs.webp';
import styles from './Chatbot.module.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const Chatbot: React.FC = () => {
  const { session, isLoading: authLoading } = useAuth();
  const { todos } = useTodos(); // Access todos to trigger refresh when needed
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: session 
        ? "Hello! I'm your Todo Assistant. I can help you manage your tasks using natural language. Try saying 'create a todo' or 'show my todos'."
        : "Hello! Please sign in to use the Todo Assistant. I can help you manage your tasks using natural language once you're authenticated.",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commandExamples = [
    { category: 'Create Todos', commands: [
      'Create a todo called Buy groceries for the weekend party',
      'Add a new todo Finish quarterly project report and submit to manager',
      'Create a high priority todo Schedule client meeting for next week',
      'Add todo Review all project documents and provide feedback due 2024-12-31'
    ]},
    { category: 'View Todos', commands: [
      'Show my todos',
      'What are my todos',
      'List all todos',
      'Display my tasks'
    ]},
    { category: 'Complete Todos', commands: [
      'Complete the todo Buy groceries',
      'Mark Buy groceries as done',
      'Finish the todo Review documents'
    ]},
    { category: 'Delete Todos', commands: [
      'Delete the todo Buy groceries',
      'Remove the todo Review documents'
    ]},
    { category: 'Query', commands: [
      'How many todos do I have',
      'Count my todos',
      'Help'
    ]}
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update welcome message when auth state changes
  useEffect(() => {
    if (!authLoading) {
      if (session && messages.length === 1 && messages[0].id === '1') {
        setMessages([{
          id: '1',
          text: "Hello! I'm your Todo Assistant. I can help you manage your tasks using natural language. Try saying 'create a todo' or 'show my todos'.",
          sender: 'bot',
          timestamp: new Date(),
        }]);
      } else if (!session && messages.length === 1 && messages[0].id === '1') {
        setMessages([{
          id: '1',
          text: "Hello! Please sign in to use the Todo Assistant. I can help you manage your tasks using natural language once you're authenticated.",
          sender: 'bot',
          timestamp: new Date(),
        }]);
      }
    }
  }, [session, authLoading]);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!session) {
      addMessage('Please sign in to use the chatbot.', 'bot');
      return;
    }

    const userMessage = input.trim();
    addMessage(userMessage, 'user');
    setInput('');
    setShowCommands(false);
    setIsLoading(true);

    try {
      // Process command directly without chat server
      const response = await processChatCommand(userMessage, todos);
      
      // Check if the message might have modified tasks (create, update, delete, complete)
      const taskModifyingKeywords = ['create', 'add', 'update', 'edit', 'delete', 'remove', 'complete', 'finish', 'mark'];
      const mightHaveModifiedTasks = taskModifyingKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      setTimeout(() => {
        addMessage(response, 'bot');
        setIsLoading(false);
        
        // Reload tasks if the command might have modified them
        if (mightHaveModifiedTasks) {
          // Trigger a refresh by reloading tasks from API
          setTimeout(async () => {
            try {
              await apiService.getTasks();
              window.dispatchEvent(new Event('tasks-updated'));
            } catch (error) {
              console.error('Failed to refresh tasks:', error);
            }
          }, 500);
        }
      }, 300);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
      
      setTimeout(() => {
        addMessage(errorMessage, 'bot');
        setIsLoading(false);
      }, 300);
    }
  };

  const handleCommandSelect = async (command: string) => {
    if (!session) {
      addMessage('Please sign in to use the chatbot.', 'bot');
      return;
    }

    setInput(command);
    setShowCommands(false);
    
    // Auto-submit the selected command
    setTimeout(async () => {
      addMessage(command, 'user');
      setIsLoading(true);
      
      try {
        // Process command directly without chat server
        const response = await processChatCommand(command, todos);
        
        // Check if the command might have modified tasks
        const taskModifyingKeywords = ['create', 'add', 'update', 'edit', 'delete', 'remove', 'complete', 'finish', 'mark'];
        const mightHaveModifiedTasks = taskModifyingKeywords.some(keyword => 
          command.toLowerCase().includes(keyword)
        );

        setTimeout(() => {
          addMessage(response, 'bot');
          setIsLoading(false);
          
          // Reload tasks if the command might have modified them
          if (mightHaveModifiedTasks) {
            setTimeout(async () => {
              try {
                await apiService.getTasks();
                window.dispatchEvent(new Event('tasks-updated'));
              } catch (error) {
                console.error('Failed to refresh tasks:', error);
              }
            }, 500);
          }
        }, 300);
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
        
        setTimeout(() => {
          addMessage(errorMessage, 'bot');
          setIsLoading(false);
        }, 300);
      }
      
      setInput('');
    }, 100);
  };

  return (
    <>
      {!isOpen && (
        <button
          className={styles.chatButton}
          onClick={() => setIsOpen(true)}
          aria-label="Open chatbot"
        >
          <img src={chatbotIcon} alt="Chatbot" className={styles.chatIcon} />
        </button>
      )}

      {isOpen && (
        <div className={styles.chatbot}>
          <div className={styles.chatHeader}>
            <h3>Todo Assistant</h3>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>
          <div className={styles.messages}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.sender]}`}
              >
                <div className={styles.messageContent}>{message.text}</div>
                <div className={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.bot}`}>
                <div className={styles.messageContent}>
                  <span className={styles.typingIndicator}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.commandsSection}>
            <button
              type="button"
              className={styles.commandsToggle}
              onClick={() => setShowCommands(!showCommands)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Quick Commands
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={showCommands ? styles.rotated : ''}
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showCommands && (
              <div className={styles.commandsDropdown}>
                {commandExamples.map((category, catIdx) => (
                  <div key={catIdx} className={styles.commandCategory}>
                    <div className={styles.categoryHeader}>{category.category}</div>
                    {category.commands.map((cmd, cmdIdx) => (
                      <button
                        key={cmdIdx}
                        type="button"
                        className={styles.commandOption}
                        onClick={() => handleCommandSelect(cmd)}
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className={styles.input}
              autoFocus
            />
            <button type="submit" className={styles.sendButton} aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
