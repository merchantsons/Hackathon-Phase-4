import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { authClient } from '../lib/auth';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Session {
  user: User;
  expires: string;
}

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use custom session management only (Better Auth integration removed for now)
  const [customSession, setCustomSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to get session from Better Auth first, then fallback to custom session
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Try to validate token by making an API call
          try {
            await apiService.getTasks();
            // If successful, we have a valid session
            const userEmail = localStorage.getItem('user_email') || '';
            const userName = localStorage.getItem('user_name') || '';
            setCustomSession({
              user: {
                id: localStorage.getItem('user_id') || '',
                email: userEmail,
                name: userName || undefined,
              },
              expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
          } catch (error) {
            // Token invalid or API unavailable, clear it
            console.warn('Token validation failed, clearing session:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_id');
            setCustomSession(null);
          }
        } else {
          // No token, ensure loading is set to false quickly
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const session = customSession;
  const isPending = isLoading;

  const signIn = async (email: string, password: string) => {
    try {
      // Use custom API (backend has custom endpoints)
      const response = await apiService.login(email, password);
      if (response.token) {
        // Store session info
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_email', email);
        if (response.user) {
          localStorage.setItem('user_id', response.user.id?.toString() || '');
          if (response.user.name) {
            localStorage.setItem('user_name', response.user.name);
          }
          setCustomSession({
            user: {
              id: response.user.id?.toString() || '',
              email: response.user.email || email,
              name: response.user.name,
            },
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } else {
          // Fallback if user info not in response
          setCustomSession({
            user: {
              id: '',
              email: email,
            },
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Use custom API (backend has custom endpoints)
      const response = await apiService.register(email, password, name);
      // After registration, automatically sign in
      if (response) {
        await signIn(email, password);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      // Ignore Better Auth errors
    }
    // Clear custom session
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    setCustomSession(null);
    apiService.clearAuthToken();
  };

  return (
    <AuthContext.Provider
      value={{
        session: session as Session | null,
        isLoading: isPending,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
