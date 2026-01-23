# Data Model

## Todo Entity

```typescript
interface Todo {
  id: string;                    // UUID or timestamp-based unique ID
  title: string;                 // Required, max 200 characters
  description?: string;           // Optional, max 1000 characters
  dueDate?: string;              // ISO 8601 date string (YYYY-MM-DD)
  priority: Priority;            // Enum: 'low' | 'medium' | 'high'
  status: Status;                // Enum: 'pending' | 'completed'
  createdAt: string;             // ISO 8601 datetime string
  updatedAt: string;             // ISO 8601 datetime string
}

type Priority = 'low' | 'medium' | 'high';
type Status = 'pending' | 'completed';
```

## Filter State

```typescript
interface FilterState {
  status: StatusFilter;          // 'all' | 'pending' | 'completed'
  priority: PriorityFilter;      // 'all' | 'low' | 'medium' | 'high'
  dueDate: DueDateFilter;       // 'all' | 'today' | 'thisWeek' | 'overdue'
  sortBy: SortField;             // 'dueDate' | 'priority' | 'createdAt' | 'title'
  sortOrder: SortOrder;          // 'asc' | 'desc'
  searchQuery: string;           // Search term (trimmed, case-insensitive)
}

type StatusFilter = 'all' | 'pending' | 'completed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high';
type DueDateFilter = 'all' | 'today' | 'thisWeek' | 'overdue';
type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title';
type SortOrder = 'asc' | 'desc';
```

## Storage Schema

### localStorage Key
`todos-app-data`

### Storage Format
```json
{
  "todos": [
    {
      "id": "uuid-here",
      "title": "Example todo",
      "description": "Optional description",
      "dueDate": "2024-12-31",
      "priority": "high",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "version": "1.0.0"
}
```

## Data Validation Rules

### Todo Validation
- **id**: Required, non-empty string, unique
- **title**: Required, 1-200 characters, trimmed
- **description**: Optional, max 1000 characters, trimmed
- **dueDate**: Optional, valid ISO date string (YYYY-MM-DD)
- **priority**: Required, must be 'low', 'medium', or 'high'
- **status**: Required, must be 'pending' or 'completed'
- **createdAt**: Required, valid ISO datetime string
- **updatedAt**: Required, valid ISO datetime string

### Filter Validation
- **status**: Must be 'all', 'pending', or 'completed'
- **priority**: Must be 'all', 'low', 'medium', or 'high'
- **dueDate**: Must be 'all', 'today', 'thisWeek', or 'overdue'
- **sortBy**: Must be 'dueDate', 'priority', 'createdAt', or 'title'
- **sortOrder**: Must be 'asc' or 'desc'
- **searchQuery**: String, trimmed, case-insensitive

## Data Operations

### Create Todo
1. Generate unique ID
2. Set createdAt and updatedAt to current timestamp
3. Set default priority to 'medium' if not provided
4. Set default status to 'pending'
5. Validate all fields
6. Add to todos array
7. Save to localStorage

### Update Todo
1. Find todo by ID
2. Update provided fields
3. Update updatedAt timestamp
4. Validate all fields
5. Save to localStorage

### Delete Todo
1. Find todo by ID
2. Remove from todos array
3. Save to localStorage

### Filter Todos
1. Apply status filter
2. Apply priority filter
3. Apply due date filter
4. Apply search query
5. Return filtered array

### Sort Todos
1. Get sort field and order
2. Compare todos based on sort field
3. Apply sort order (asc/desc)
4. Return sorted array

## Priority Ordering
- High: 3
- Medium: 2
- Low: 1

## Date Calculations

### Today
Date matching current date (YYYY-MM-DD)

### This Week
Dates from start of current week (Monday) to end of current week (Sunday)

### Overdue
Dates before today with status 'pending'
