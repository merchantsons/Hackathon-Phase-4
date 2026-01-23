import React, { useState } from 'react';
import { useTodos } from '../../hooks/useTodos';
import { useToast } from '../../context/ToastContext';
import { Todo } from '../../types/todo';
import { TodoForm } from '../TodoForm/TodoForm';
import styles from './TodoItem.module.css';

interface TodoItemProps {
  todo: Todo;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const { toggleStatus, deleteTodo } = useTodos();
  const { showToast, showConfirm } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleStatus = async () => {
    try {
      await toggleStatus(todo.id);
      showToast('Todo status updated successfully', 'success');
    } catch (error) {
      console.error('Failed to toggle todo status:', error);
      showToast('Failed to update todo status. Please try again.', 'error');
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Are you sure you want to delete this todo?',
      async () => {
        try {
          await deleteTodo(todo.id);
          showToast('Todo deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete todo:', error);
          showToast('Failed to delete todo. Please try again.', 'error');
        }
      }
    );
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = () => {
    if (!todo.dueDate || todo.status === 'completed') return false;
    const dueDate = new Date(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <>
      <div className={`${styles.todoItem} ${todo.status === 'completed' ? styles.completed : ''}`}>
        <div className={styles.content}>
          <div className={styles.header}>
            <input
              type="checkbox"
              checked={todo.status === 'completed'}
              onChange={handleToggleStatus}
              className={styles.checkbox}
              aria-label="Toggle todo status"
            />
            <h3 className={styles.title}>{todo.title}</h3>
            <span className={`${styles.priority} ${getPriorityClass(todo.priority)}`}>
              {todo.priority}
            </span>
          </div>

          {todo.description && (
            <p className={styles.description}>{todo.description}</p>
          )}

          <div className={styles.meta}>
            {todo.dueDate && (
              <span className={`${styles.dueDate} ${isOverdue() ? styles.overdue : ''}`}>
                Due: {formatDate(todo.dueDate)}
              </span>
            )}
            <span className={styles.createdAt}>
              Created: {formatDate(todo.createdAt)}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
            aria-label="Edit todo"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className={styles.deleteButton}
            aria-label="Delete todo"
          >
            Delete
          </button>
        </div>
      </div>

      {isEditing && (
        <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Todo</h2>
              <button
                className={styles.modalCloseButton}
                onClick={() => setIsEditing(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <TodoForm
                todo={todo}
                onCancel={() => setIsEditing(false)}
                onSubmit={() => setIsEditing(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
