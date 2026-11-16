import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const ToastContext = createContext(null);
// Erros ficam mais tempo na tela; o tempo pausa com o mouse ou o foco sobre as notificações.
const DURACAO = { sucesso: 4000, erro: 7000 };
const duracaoDe = (tipo) => DURACAO[tipo] ?? DURACAO.sucesso;

function Toast({ toast, pausado, onExpirar, onFechar }) {
  const restante = useRef(duracaoDe(toast.tipo));

  useEffect(() => {
    if (pausado) return undefined;
    const inicio = Date.now();
    const timer = setTimeout(() => onExpirar(toast.id), restante.current);
    return () => {
      clearTimeout(timer);
      restante.current -= Date.now() - inicio;
    };
  }, [pausado, onExpirar, toast.id]);

  return (
    <motion.div
      layout
      className={`toast ${toast.tipo}`}
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <span className="toast-icon" aria-hidden="true">
        {toast.tipo === 'erro' ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
      </span>
      <span className="toast-text">{toast.texto}</span>
      <button type="button" className="toast-close" onClick={() => onFechar(toast.id)} aria-label="Fechar notificação">
        <X size={14} />
      </button>
      <span className="toast-progress" style={{ animationDuration: `${duracaoDe(toast.tipo)}ms` }} />
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [hover, setHover] = useState(false);
  const [foco, setFoco] = useState(false);
  const proximoId = useRef(0);
  const pausado = hover || foco;

  const remover = useCallback((id) => {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }, []);

  // Fechar pelo botão tira o foco da pilha (o botão some junto com o toast)
  const fechar = useCallback((id) => {
    remover(id);
    setFoco(false);
  }, [remover]);

  const mostrarToast = useCallback((tipo, texto) => {
    const id = ++proximoId.current;
    setToasts((atual) => [...atual.slice(-3), { id, tipo, texto }]);
  }, []);

  // Sem toasts, não há onde o mouse estar: evita ficar "pausado" para sempre
  // quando o último some debaixo do cursor sem disparar mouseleave.
  useEffect(() => {
    if (toasts.length === 0) {
      setHover(false);
      setFoco(false);
    }
  }, [toasts.length]);

  const valor = useMemo(() => ({ mostrarToast }), [mostrarToast]);

  const grupo = (erros) => (
    <AnimatePresence initial={false}>
      {toasts.filter((t) => (t.tipo === 'erro') === erros).map((t) => (
        <Toast key={t.id} toast={t} pausado={pausado} onExpirar={remover} onFechar={fechar} />
      ))}
    </AnimatePresence>
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        className={`toast-stack ${pausado ? 'pausado' : ''}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFoco(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false); }}
      >
        {/* Duas regiões fixas: erros são anunciados na hora (alert); sucessos, sem interromper (status) */}
        <div className="toast-grupo" role="alert" aria-atomic="false">{grupo(true)}</div>
        <div className="toast-grupo" role="status" aria-atomic="false">{grupo(false)}</div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
