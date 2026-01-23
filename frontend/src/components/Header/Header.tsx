import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../Auth/UserMenu';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { session } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div>
          <h1 className={styles.title}>Todo With Chatbot</h1>
          <p className={styles.subtitle}>Manage your tasks efficiently</p>
        </div>
        <div className={styles.authSection}>
          {session && <UserMenu />}
        </div>
      </div>
    </header>
  );
};
