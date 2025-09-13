import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Callback() {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(true);
    navigate('/');
  }, [setIsAuthenticated, navigate]);

  return <div className="p-4">Logging in...</div>;
}
