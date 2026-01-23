import { Todo, FilterState, Priority } from '../types/todo';

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const filterTodos = (todos: Todo[], filters: FilterState): Todo[] => {
  let filtered = [...todos];

  // Filter by status
  if (filters.status !== 'all') {
    filtered = filtered.filter(todo => todo.status === filters.status);
  }

  // Filter by priority
  if (filters.priority !== 'all') {
    filtered = filtered.filter(todo => todo.priority === filters.priority);
  }

  // Filter by due date
  if (filters.dueDate !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(todo => {
      if (!todo.dueDate) return false;
      
      const dueDate = new Date(todo.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      switch (filters.dueDate) {
        case 'today':
          return dueDate.getTime() === today.getTime();
        case 'thisWeek':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // Monday
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // Sunday
          return dueDate >= weekStart && dueDate <= weekEnd;
        case 'overdue':
          return dueDate < today && todo.status === 'pending';
        default:
          return true;
      }
    });
  }

  // Search filter
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(todo => 
      todo.title.toLowerCase().includes(query) ||
      (todo.description && todo.description.toLowerCase().includes(query))
    );
  }

  return filtered;
};

export const sortTodos = (todos: Todo[], sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']): Todo[] => {
  const sorted = [...todos];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        break;
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) comparison = 0;
        else if (!a.dueDate) comparison = 1;
        else if (!b.dueDate) comparison = -1;
        else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};
