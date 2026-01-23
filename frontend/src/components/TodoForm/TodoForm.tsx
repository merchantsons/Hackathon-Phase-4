import React, { useState, useEffect } from 'react';
import { useTodos } from '../../hooks/useTodos';
import { useToast } from '../../context/ToastContext';
import { Todo, Priority } from '../../types/todo';
import styles from './TodoForm.module.css';

interface TodoFormProps {
  todo?: Todo;
  onCancel?: () => void;
  onSubmit?: () => void;
}

export const TodoForm: React.FC<TodoFormProps> = ({ todo, onCancel, onSubmit }) => {
  const { addTodo, updateTodo } = useTodos();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setDueDate(todo.dueDate || '');
      setPriority(todo.priority);
    }
  }, [todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    setErrors({});

    try {
      if (todo) {
        // Update existing todo
        await updateTodo(todo.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          priority,
        });
        showToast('Todo updated successfully', 'success');
      } else {
        // Create new todo
        addTodo({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          priority,
          status: 'pending',
        });
        showToast('Todo created successfully', 'success');
        // Reset form
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority('medium');
      }
      onSubmit?.();
    } catch (error) {
      console.error('Failed to save todo:', error);
      const errorMessage = 'Failed to save todo. Please try again.';
      setErrors({ title: errorMessage });
      showToast(errorMessage, 'error');
    }
  };

  const handleCancel = () => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setDueDate(todo.dueDate || '');
      setPriority(todo.priority);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
    }
    setErrors({});
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors({});
          }}
          className={errors.title ? styles.inputError : styles.input}
          placeholder="Enter todo title"
          maxLength={200}
        />
        {errors.title && <span className={styles.error}>{errors.title}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          placeholder="Enter todo description (optional)"
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={styles.select}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton}>
          {todo ? 'Update Todo' : 'Add Todo'}
        </button>
        {(todo || title || description) && (
          <button type="button" onClick={handleCancel} className={styles.cancelButton}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
