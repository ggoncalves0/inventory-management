import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import instance, { AUTH_EXPIRED_EVENT, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

// Sessão expirada: guardado nesta aba para a tela de login explicar o que houve e já vir com o usuário.
const CHAVE_AVISO = 'estoque:sessao-expirada';

function lerAviso() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_AVISO));
  } catch {
    return null;
  }
}

function gravarAviso(aviso) {
  try {
    if (aviso) sessionStorage.setItem(CHAVE_AVISO, JSON.stringify(aviso));
    else sessionStorage.removeItem(CHAVE_AVISO);
  } catch {
    // sem sessionStorage: o aviso vale só enquanto a página estiver aberta
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(!!token);
  const [avisoSessao, setAvisoSessao] = useState(lerAviso);
  // Lido no momento da expiração (o listener não deve depender do estado a cada render)
  const usuarioRef = useRef(null);
  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);

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

  // 401 em qualquer chamada (token expirado ou inválido): encerra a sessão lembrando quem estava logado,
  // para o login dizer "sua sessão expirou" em vez de simplesmente aparecer.
  useEffect(() => {
    const aoExpirar = () => {
      const aviso = { usuario: usuarioRef.current?.username ?? null };
      gravarAviso(aviso);
      setAvisoSessao(aviso);
      logout();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, aoExpirar);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, aoExpirar);
  }, [logout]);

  const login = useCallback(async (username, senha) => {
    const { data } = await instance.post('/login', { username, senha });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    gravarAviso(null);
    setAvisoSessao(null);
    setToken(data.access_token);
  }, []);

  const valor = useMemo(
    () => ({ token, usuario, carregando, login, logout, avisoSessao, isAdmin: !!usuario?.is_admin }),
    [token, usuario, carregando, login, logout, avisoSessao]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
