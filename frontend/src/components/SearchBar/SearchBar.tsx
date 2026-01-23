import React from 'react';
import { useTodos } from '../../hooks/useTodos';
import styles from './SearchBar.module.css';

export const SearchBar: React.FC = () => {
  const { filters, setFilter } = useTodos();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ searchQuery: e.target.value });
  };

  const handleClear = () => {
    setFilter({ searchQuery: '' });
  };

  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search todos..."
        value={filters.searchQuery}
        onChange={handleChange}
        className={styles.input}
      />
      {filters.searchQuery && (
        <button onClick={handleClear} className={styles.clearButton} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
};
