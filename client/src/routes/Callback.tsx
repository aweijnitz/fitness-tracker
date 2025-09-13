import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { token } from 'openauth-js';
import { tokenManager } from '../auth/tokenManager';
import type { TokenSet } from '../auth/tokenManager';

export default function Callback() {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function handle() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) {
        navigate('/login');
        return;
      }
      const res = await token(code);
      const tokens: TokenSet = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        expiresAt: Date.now() + res.expires_in * 1000,
      };
      await tokenManager.save(tokens);
      setIsAuthenticated(true);
      navigate('/');
    }
    handle();
  }, [setIsAuthenticated, navigate]);

  return <div className="p-4">Logging in...</div>;
}
