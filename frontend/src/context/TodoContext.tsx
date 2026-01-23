import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Todo, FilterState, Status } from '../types/todo';
import { saveTodos, loadTodos } from '../utils/storage';
import { filterTodos, sortTodos } from '../utils/filters';
import { apiService, Task } from '../services/api';

interface TodoState {
  todos: Todo[];
  filters: FilterState;
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<Todo> } }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'TOGGLE_STATUS'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'LOAD_TODOS'; payload: Todo[] }
  | { type: 'CLEAR_FILTERS' };

const initialState: TodoState = {
  todos: [],
  filters: {
    status: 'all',
    priority: 'all',
    dueDate: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    searchQuery: '',
  },
};

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'LOAD_TODOS':
      return { ...state, todos: action.payload };

    case 'ADD_TODO': {
      const now = new Date().toISOString();
      const tempId = `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newTodo: Todo = {
        ...action.payload,
        id: tempId,
        createdAt: now,
        updatedAt: now,
        priority: action.payload.priority || 'medium',
        status: action.payload.status || 'pending',
      };
      const updatedTodos = [...state.todos, newTodo];
      
      // Save to API asynchronously and trigger reload via event
      apiService.createTask({
        title: newTodo.title,
        description: newTodo.description,
        priority: newTodo.priority,
        due_date: newTodo.dueDate,
      })
        .then(async () => {
          // Trigger reload via event (handled by useEffect in TodoProvider)
          window.dispatchEvent(new Event('tasks-updated'));
        })
        .catch((error) => {
          console.error('Failed to save to API:', error);
          // Fallback to localStorage
          saveTodos(updatedTodos);
        });
      
      return { ...state, todos: updatedTodos };
    }

    case 'UPDATE_TODO': {
      // Optimistically update UI immediately
      const updatedTodos = state.todos.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, ...action.payload.updates, updatedAt: new Date().toISOString() }
          : todo
      );
      return { ...state, todos: updatedTodos };
    }

    case 'DELETE_TODO': {
      // Optimistically remove from UI immediately
      const updatedTodos = state.todos.filter(todo => todo.id !== action.payload);
      return { ...state, todos: updatedTodos };
    }

    case 'TOGGLE_STATUS': {
      // Optimistically update UI immediately
      const updatedTodos = state.todos.map(todo =>
        todo.id === action.payload
          ? {
              ...todo,
              status: (todo.status === 'pending' ? 'completed' : 'pending') as Status,
              updatedAt: new Date().toISOString(),
            }
          : todo
      );
      return { ...state, todos: updatedTodos };
    }

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
      };

    default:
      return state;
  }
};

interface TodoContextType {
  state: TodoState;
  dispatch: React.Dispatch<TodoAction>;
  filteredAndSortedTodos: Todo[];
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Load todos on mount and when auth state might change
  useEffect(() => {
    const loadTodosFromAPI = async () => {
      try {
        // Try to load from API first
        const apiTasks = await apiService.getTasks();
        // Convert API tasks to Todo format
        const todos: Todo[] = apiTasks.map((task: Task) => ({
          id: String(task.id), // Convert number ID to string for frontend
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          status: task.status as 'pending' | 'completed',
          dueDate: task.due_date || undefined,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }));
        dispatch({ type: 'LOAD_TODOS', payload: todos });
      } catch (error) {
        console.warn('Failed to load from API, falling back to localStorage:', error);
        // Fallback to localStorage if API fails
        const todos = loadTodos();
        dispatch({ type: 'LOAD_TODOS', payload: todos });
      }
    };

    loadTodosFromAPI();

    // Listen for tasks-updated event from Chatbot
    const handleTasksUpdate = () => {
      loadTodosFromAPI();
    };
    window.addEventListener('tasks-updated', handleTasksUpdate);

    return () => {
      window.removeEventListener('tasks-updated', handleTasksUpdate);
    };
  }, []);

  // Compute filtered and sorted todos
  const filteredTodos = filterTodos(state.todos, state.filters);
  const filteredAndSortedTodos = sortTodos(
    filteredTodos,
    state.filters.sortBy,
    state.filters.sortOrder
  );

  return (
    <TodoContext.Provider value={{ state, dispatch, filteredAndSortedTodos }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodoContext = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoContext must be used within TodoProvider');
  }
  return context;
};
