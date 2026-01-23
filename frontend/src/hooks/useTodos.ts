import { useTodoContext } from '../context/TodoContext';
import { Todo } from '../types/todo';
import { apiService } from '../services/api';

export const useTodos = () => {
  const { state, dispatch, filteredAndSortedTodos } = useTodoContext();

  const addTodo = (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_TODO', payload: todo });
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    // Check if ID is a temporary string ID (starts with "todo-")
    // If so, we can't update it yet - need to wait for it to be saved to API first
    if (id.startsWith('todo-')) {
      console.warn('Cannot update task with temporary ID. Task may not be saved to API yet.');
      // Still update optimistically
      dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
      return;
    }
    
    // Convert string ID to number for API call
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      console.error('Invalid task ID:', id);
      throw new Error('Invalid task ID');
    }
    
    // Optimistically update UI immediately
    dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
    
    // Prepare update payload - only include fields that are provided
    const updatePayload: any = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.priority !== undefined) updatePayload.priority = updates.priority;
    if (updates.dueDate !== undefined) updatePayload.due_date = updates.dueDate || null;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    
    try {
      await apiService.updateTask(taskId, updatePayload);
      // Reload todos from API to get the latest state
      const apiTasks = await apiService.getTasks();
      const todos: Todo[] = apiTasks.map((task: any) => ({
        id: String(task.id),
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
      console.error('Failed to update in API:', error);
      // Reload from API to sync state on error
      try {
        const apiTasks = await apiService.getTasks();
        const todos: Todo[] = apiTasks.map((task: any) => ({
          id: String(task.id),
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          status: task.status as 'pending' | 'completed',
          dueDate: task.due_date || undefined,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }));
        dispatch({ type: 'LOAD_TODOS', payload: todos });
      } catch (reloadError) {
        console.error('Failed to reload todos:', reloadError);
      }
      throw error;
    }
  };

  const deleteTodo = async (id: string) => {
    // Check if ID is a temporary string ID (starts with "todo-")
    // If so, just remove it from local state (it was never saved to API)
    if (id.startsWith('todo-')) {
      dispatch({ type: 'DELETE_TODO', payload: id });
      return;
    }
    
    // Convert string ID to number for API call
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      console.error('Invalid task ID:', id);
      throw new Error('Invalid task ID');
    }
    
    // Optimistically remove from UI
    dispatch({ type: 'DELETE_TODO', payload: id });
    
    // Delete from API
    try {
      await apiService.deleteTask(taskId);
      // Reload todos from API to get the latest state
      const apiTasks = await apiService.getTasks();
      const todos: Todo[] = apiTasks.map((task: any) => ({
        id: String(task.id),
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
      console.error('Failed to delete from API:', error);
      // Reload from API to sync state
      try {
        const apiTasks = await apiService.getTasks();
        const todos: Todo[] = apiTasks.map((task: any) => ({
          id: String(task.id),
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          status: task.status as 'pending' | 'completed',
          dueDate: task.due_date || undefined,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }));
        dispatch({ type: 'LOAD_TODOS', payload: todos });
      } catch (reloadError) {
        console.error('Failed to reload todos:', reloadError);
      }
      throw error;
    }
  };

  const toggleStatus = async (id: string) => {
    // Check if ID is a temporary string ID (starts with "todo-")
    // If so, just update optimistically (it will be saved when the task is created)
    if (id.startsWith('todo-')) {
      dispatch({ type: 'TOGGLE_STATUS', payload: id });
      return;
    }
    
    // Convert string ID to number for API call
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      console.error('Invalid task ID:', id);
      throw new Error('Invalid task ID');
    }
    
    // Find the current task to determine its status
    const todo = state.todos.find(t => t.id === id);
    if (!todo) {
      console.error('Task not found:', id);
      throw new Error('Task not found');
    }
    
    // Optimistically update UI immediately
    dispatch({ type: 'TOGGLE_STATUS', payload: id });
    
    try {
      // Call appropriate API endpoint based on current status
      if (todo.status === 'pending') {
        // Mark as completed
        await apiService.completeTask(taskId);
      } else {
        // Mark as pending
        await apiService.updateTask(taskId, { status: 'pending' });
      }
      
      // Reload todos from API to get the latest state
      const apiTasks = await apiService.getTasks();
      const todos: Todo[] = apiTasks.map((task: any) => ({
        id: String(task.id),
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
      console.error('Failed to toggle status in API:', error);
      // Reload from API to sync state on error
      try {
        const apiTasks = await apiService.getTasks();
        const todos: Todo[] = apiTasks.map((task: any) => ({
          id: String(task.id),
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          status: task.status as 'pending' | 'completed',
          dueDate: task.due_date || undefined,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }));
        dispatch({ type: 'LOAD_TODOS', payload: todos });
      } catch (reloadError) {
        console.error('Failed to reload todos:', reloadError);
      }
      throw error;
    }
  };

  const setFilter = (filter: Partial<typeof state.filters>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  return {
    todos: state.todos,
    filteredTodos: filteredAndSortedTodos,
    filters: state.filters,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    setFilter,
    clearFilters,
  };
};
