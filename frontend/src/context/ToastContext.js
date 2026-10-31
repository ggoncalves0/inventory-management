import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const ToastContext = createContext(null);
const DURACAO = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(0);

  const remover = useCallback((id) => {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }, []);

  const mostrarToast = useCallback((tipo, texto) => {
    const id = ++proximoId.current;
    setToasts((atual) => [...atual.slice(-3), { id, tipo, texto }]);
    setTimeout(() => remover(id), DURACAO);
  }, [remover]);

  const valor = useMemo(() => ({ mostrarToast }), [mostrarToast]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              className={`toast ${t.tipo}`}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              <span className="toast-icon">
                {t.tipo === 'sucesso' ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
              </span>
              <span className="toast-text">{t.texto}</span>
              <button className="toast-close" onClick={() => remover(t.id)} aria-label="Fechar notificação">
                <X size={14} />
              </button>
              <span className="toast-progress" style={{ animationDuration: `${DURACAO}ms` }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
