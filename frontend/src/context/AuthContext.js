import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import instance, { AUTH_EXPIRED_EVENT, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(!!token);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  // As permissões vêm sempre do servidor (/me), nunca do localStorage.
  useEffect(() => {
    if (!token) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    instance.get('/me')
      .then(({ data }) => ativo && setUsuario(data))
      .catch(() => ativo && logout())
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [token, logout]);

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (username, senha) => {
    const { data } = await instance.post('/login', { username, senha });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
  }, []);

  const valor = useMemo(
    () => ({ token, usuario, carregando, login, logout, isAdmin: !!usuario?.is_admin }),
    [token, usuario, carregando, login, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
