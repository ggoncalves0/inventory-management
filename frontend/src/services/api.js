import axios from 'axios';

export const TOKEN_KEY = 'token';
export const AUTH_EXPIRED_EVENT = 'auth:expired';

const instance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token expirado ou inválido: avisa o AuthContext para encerrar a sessão.
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.endsWith('/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export function mensagemDeErro(error, padrao) {
  if (error.code === 'ECONNABORTED') return 'O servidor demorou para responder.';
  if (!error.response) return 'Não foi possível conectar ao servidor.';
  return error.response.data?.erro || padrao;
}

export default instance;
