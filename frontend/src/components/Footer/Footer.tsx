import React from 'react';
import styles from './Footer.module.css';
import logo from '../../public/logo.png';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.topRow}>
          <div className={styles.logoContainer}>
            <img src={logo} alt="Todo With Chatbot Logo" className={styles.logo} />
          </div>
          <p className={styles.text} style={{ marginBottom: '-.6rem' }}>
            © {currentYear} Todo Application. Built with React & TypeScript.
          </p>
        </div>
        <div className={styles.textContainer}  style={{ marginTop: '-.3rem' }}>
          <p className={styles.subtext}>
            Hackathon II - Phase 4 | Spec-Driven Development           
          </p>
          <p className={styles.subtext} style={{ fontSize: '0.6rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            FOR GIAIC HACKATHON - 2 PHASE 4 BY ROLL # 00037391
          </p>
        </div>
      </div>
    </footer>
  );
};
