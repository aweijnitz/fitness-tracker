import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
