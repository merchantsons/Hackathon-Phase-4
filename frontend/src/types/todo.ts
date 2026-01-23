export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'completed';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export type StatusFilter = 'all' | 'pending' | 'completed';
export type PriorityFilter = 'all' | 'low' | 'medium' | 'high';
export type DueDateFilter = 'all' | 'today' | 'thisWeek' | 'overdue';
export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  status: StatusFilter;
  priority: PriorityFilter;
  dueDate: DueDateFilter;
  sortBy: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
}

export interface StorageData {
  todos: Todo[];
  version: string;
}
