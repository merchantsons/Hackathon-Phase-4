import { Todo, StorageData } from '../types/todo';

const STORAGE_KEY = 'todos-app-data';
const STORAGE_VERSION = '1.0.0';

export const saveTodos = (todos: Todo[]): void => {
  try {
    const data: StorageData = {
      todos,
      version: STORAGE_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save todos to localStorage:', error);
    throw new Error('Failed to save todos. Storage may be full.');
  }
};

export const loadTodos = (): Todo[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const data: StorageData = JSON.parse(stored);
    
    // Validate data structure
    if (!data.todos || !Array.isArray(data.todos)) {
      console.warn('Invalid data structure in localStorage, resetting...');
      return [];
    }

    return data.todos;
  } catch (error) {
    console.error('Failed to load todos from localStorage:', error);
    return [];
  }
};

export const clearTodos = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear todos from localStorage:', error);
  }
};
