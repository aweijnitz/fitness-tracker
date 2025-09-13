import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import useAuth from '../hooks/useAuth';

export default function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
