import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

const FOCAVEIS = 'button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])';

// `focoAoFechar`: função que devolve para onde o foco vai se quem abriu o diálogo não existe mais
// (ex.: o botão "Excluir" some junto com a linha excluída).
function ModalConteudo({ onClose, titulo, children, largura, focoAoFechar }) {
    const caixaRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const focoAoFecharRef = useRef(focoAoFechar);
    focoAoFecharRef.current = focoAoFechar;
    // Quem tinha o foco antes de abrir. Lido durante a renderização (inicializador do useState), antes do
    // autoFocus dos campos: lido num efeito, já seria o próprio campo do formulário — e o foco se perdia ao fechar.
    const [origem] = useState(() => document.activeElement);

    useEffect(() => {
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Foco inicial: se um campo já pegou o foco (autoFocus), fica nele; senão o marcado com
        // data-foco-inicial (ex.: "Cancelar" na confirmação de exclusão), o 1º campo ou o 1º controle.
        const caixa = caixaRef.current;
        if (caixa && !caixa.contains(document.activeElement)) {
            const inicial = caixa.querySelector('[data-foco-inicial]') || caixa.querySelector('input') || caixa.querySelector(FOCAVEIS);
            inicial?.focus();
        }

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
            // Devolve o foco a quem abriu; se ele saiu da página, ao destino alternativo
            const destino = origem?.isConnected && origem !== document.body ? origem : focoAoFecharRef.current?.();
            destino?.focus?.();
        };
    }, [origem]);

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                ref={caixaRef}
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                className="modal-box"
                style={{ maxWidth: largura }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.12 }}
            >
                <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
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
