import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './UserMenu.module.css';

export const UserMenu: React.FC = () => {
  const { session, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!session?.user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const userInitials = session.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session.user.email?.[0].toUpperCase() || 'U';

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        className={styles.userButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className={styles.avatar}>{userInitials}</div>
        <span className={styles.userName}>
          {session.user.name || session.user.email?.split('@')[0] || 'User'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className={isOpen ? styles.rotated : ''}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{userInitials}</div>
            <div>
              <div className={styles.userName}>{session.user.name || 'User'}</div>
              <div className={styles.userEmail}>{session.user.email}</div>
            </div>
          </div>
          <div className={styles.divider} />
          <button className={styles.menuItem} onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
