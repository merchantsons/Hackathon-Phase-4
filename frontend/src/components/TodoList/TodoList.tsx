import React from 'react';
import { useTodos } from '../../hooks/useTodos';
import { TodoItem } from '../TodoItem/TodoItem';
import styles from './TodoList.module.css';

export const TodoList: React.FC = () => {
  const { filteredTodos } = useTodos();

  if (filteredTodos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>No todos found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.todoList}>
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
};
