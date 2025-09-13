/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authorize, logout as oaLogout } from 'openauth-js';
import { tokenManager } from '../auth/tokenManager';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  setIsAuthenticated: (v: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: async () => {},
  setIsAuthenticated: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    tokenManager.load().then((tokens) => {
      if (tokens) setIsAuthenticated(true);
    }).finally(() => setLoading(false));
  }, []);

  const login = () => {
    authorize();
    navigate('/callback?code=mock-code');
  };

  const logout = async () => {
    await oaLogout();
    await tokenManager.clear();
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
