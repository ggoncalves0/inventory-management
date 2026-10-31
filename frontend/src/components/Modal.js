import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

const FOCAVEIS = 'button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])';

function ModalConteudo({ onClose, titulo, children, largura }) {
    const caixaRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const focoAnterior = document.activeElement;
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const caixa = caixaRef.current;
        const primeiro = caixa?.querySelector('[autofocus], input') || caixa?.querySelector(FOCAVEIS);
        primeiro?.focus();

        const aoTeclar = (e) => {
            if (e.key === 'Escape') {
                onCloseRef.current();
                return;
            }
            // Mantém o foco do teclado preso dentro do modal
            if (e.key === 'Tab' && caixa) {
                const itens = [...caixa.querySelectorAll(FOCAVEIS)];
                if (!itens.length) return;
                const [inicio, fim] = [itens[0], itens[itens.length - 1]];
                if (e.shiftKey && document.activeElement === inicio) {
                    e.preventDefault();
                    fim.focus();
                } else if (!e.shiftKey && document.activeElement === fim) {
                    e.preventDefault();
                    inicio.focus();
                }
            }
        };
        document.addEventListener('keydown', aoTeclar);

        return () => {
            document.removeEventListener('keydown', aoTeclar);
            document.body.style.overflow = overflowAnterior;
            focoAnterior?.focus?.();
        };
    }, []);

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                ref={caixaRef}
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                className="modal-box"
                style={{ maxWidth: largura }}
                initial={{ opacity: 0, y: 32, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
                <button className="modal-close" onClick={onClose} aria-label="Fechar">
                    <X size={18} />
                </button>
                {children}
            </motion.div>
        </motion.div>
    );
}

const Modal = ({ aberto, largura = 480, ...props }) =>
    createPortal(
        <AnimatePresence>{aberto && <ModalConteudo largura={largura} {...props} />}</AnimatePresence>,
        document.body
    );

export default Modal;
