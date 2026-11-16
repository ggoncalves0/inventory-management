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

// Sessão deslizante: quando o token passa da metade da validade, o backend devolve um novo no header
// X-Novo-Token. Só troca se ainda há sessão: uma resposta atrasada não pode "relogar" quem acabou de sair.
function guardarTokenRenovado(resposta) {
  const novo = resposta?.headers?.['x-novo-token'];
  if (novo && localStorage.getItem(TOKEN_KEY)) localStorage.setItem(TOKEN_KEY, novo);
}

// 401 no /login é usuário ou senha errados, não sessão expirada: não encerra nada.
instance.interceptors.response.use(
  (response) => {
    guardarTokenRenovado(response);
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.endsWith('/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    } else {
      guardarTokenRenovado(error.response);
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
