import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Footer } from '../Footer/Footer';
import logo from '../../public/logo.png';
import styles from './Landing.module.css';

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (password.length === 0) return 'weak';
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  
  if (strength <= 2) return 'weak';
  if (strength <= 3) return 'fair';
  if (strength <= 4) return 'good';
  return 'strong';
};

const getPasswordRequirements = (password: string) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
};

export const Landing: React.FC = () => {
  const { signIn, signUp, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const passwordRequirements = useMemo(() => getPasswordRequirements(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name || undefined);
      }
      // Success - auth context will update and App will show Todo page
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
    setShowPasswordRequirements(false);
  };

  const isPasswordValid = useMemo(() => {
    if (isLoginMode) return password.length >= 6;
    return passwordRequirements.length && 
           passwordRequirements.uppercase && 
           passwordRequirements.lowercase && 
           passwordRequirements.number;
  }, [password, passwordRequirements, isLoginMode]);

  return (
    <div className={styles.landing}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src={logo} alt="Todo Application Logo" className={styles.logo} />
          </div>
          <h1 className={styles.title}>
            {isLoginMode ? 'Todo With Chatbot' : 'Get Started'}
          </h1>
          <p className={styles.subtitle}>
            {isLoginMode 
              ? 'Sign in to manage your tasks efficiently' 
              : 'Create your account and start organizing your life'}
          </p>
          <div className={styles.phaseBadge} style={{ paddingBottom: '0.6rem' }}>
            <span className={styles.badgeText}>Hackathon II - Phase 4</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${isLoginMode ? styles.active : ''}`}
              onClick={() => setIsLoginMode(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`${styles.tab} ${!isLoginMode ? styles.active : ''}`}
              onClick={() => setIsLoginMode(false)}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLoginMode && (
              <div className={styles.formGroup}>
                <label htmlFor="name">Name (Optional)</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">
                Password
                {!isLoginMode && (
                  <span className={styles.required}>*</span>
                )}
              </label>
              <div className={styles.passwordContainer}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!isLoginMode) {
                      setShowPasswordRequirements(e.target.value.length > 0);
                    }
                  }}
                  onFocus={() => !isLoginMode && setShowPasswordRequirements(true)}
                  placeholder="Enter your password"
                  required
                  minLength={isLoginMode ? 6 : 8}
                  className={`${styles.input} ${!isLoginMode && password.length > 0 ? styles[`inputStrength${passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}`] : ''}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {!isLoginMode && showPasswordRequirements && (
                <div className={`${styles.passwordRequirements} ${password.length > 0 ? styles[`requirementsStrength${passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}`] : ''}`}>
                  <div className={`${styles.requirementItem} ${passwordRequirements.length ? styles.requirementMet : styles.requirementUnmet}`}>
                    <div className={styles.requirementIcon}>
                      {passwordRequirements.length ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#2e7d32"/>
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#bdbdbd" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <span className={styles.requirementText}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className={`${styles.requirementItem} ${passwordRequirements.uppercase ? styles.requirementMet : styles.requirementUnmet}`}>
                    <div className={styles.requirementIcon}>
                      {passwordRequirements.uppercase ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#2e7d32"/>
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#bdbdbd" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <span className={styles.requirementText}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className={`${styles.requirementItem} ${passwordRequirements.lowercase ? styles.requirementMet : styles.requirementUnmet}`}>
                    <div className={styles.requirementIcon}>
                      {passwordRequirements.lowercase ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#2e7d32"/>
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#bdbdbd" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <span className={styles.requirementText}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className={`${styles.requirementItem} ${passwordRequirements.number ? styles.requirementMet : styles.requirementUnmet}`}>
                    <div className={styles.requirementIcon}>
                      {passwordRequirements.number ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#2e7d32"/>
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#bdbdbd" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <span className={styles.requirementText}>
                      One number
                    </span>
                  </div>
                  <div className={`${styles.requirementItem} ${passwordRequirements.special ? styles.requirementMet : styles.requirementUnmet}`}>
                    <div className={styles.requirementIcon}>
                      {passwordRequirements.special ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#2e7d32"/>
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#bdbdbd" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <span className={styles.requirementText}>
                      One special character
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || isLoading || (!isLoginMode && !isPasswordValid)}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Processing...
                </>
              ) : isLoginMode ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={switchMode}
                disabled={isSubmitting}
              >
                {isLoginMode ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
