import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './Auth/AuthModal';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { session, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <>
        {children}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
};
