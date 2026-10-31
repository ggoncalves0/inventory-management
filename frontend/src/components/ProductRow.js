import { forwardRef, memo } from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2 } from 'lucide-react';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const ESTOQUE_BAIXO = 5;
const ESTOQUE_MEDIO = 20;

function nivelEstoque(qtd) {
    if (qtd <= ESTOQUE_BAIXO) return 'baixo';
    if (qtd <= ESTOQUE_MEDIO) return 'medio';
    return 'ok';
}

// Memoizada: digitar na busca só re-renderiza (e mede o layout de) linhas que mudaram.
// forwardRef é exigido pelo AnimatePresence em modo "popLayout".
const ProductRow = memo(forwardRef(({ produto: p, indice, isAdmin, maxQtd, onEditar, onExcluir }, ref) => {
    const nivel = nivelEstoque(p.quantidade);
    const atraso = Math.min(indice, 12) * 0.03;

    return (
        <motion.div
            ref={ref}
            layout="position"
            role="row"
            className="row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
            transition={{
                delay: atraso,
                type: 'spring', stiffness: 380, damping: 32,
                layout: { type: 'spring', stiffness: 500, damping: 40 },
            }}
        >
            <span role="cell" className="td td-id">#{p.id}</span>
            <span role="cell" className="td td-nome">
                <span className="product-avatar">{p.nome.charAt(0).toUpperCase()}</span>
                <span className="product-name">{p.nome}</span>
            </span>
            <span role="cell" className="td td-categoria">
                <span className="category-tag">{p.categoria}</span>
            </span>
            <span role="cell" className="td td-quantidade">
                <span className={`stock ${nivel}`}>
                    <span className="stock-num">{inteiro.format(p.quantidade)}</span>
                    <span className="stock-bar">
                        {/* scaleX em vez de width: anima só no compositor, sem recalcular layout */}
                        <motion.span
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: Math.max(0.04, p.quantidade / maxQtd) }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 + atraso }}
                        />
                    </span>
                    {nivel === 'baixo' && <span className="stock-badge">Baixo</span>}
                </span>
            </span>
            <span role="cell" className="td td-preco">{moeda.format(p.preco)}</span>
            {isAdmin && (
                <span role="cell" className="td td-acoes">
                    <motion.button
                        className="icon-btn"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEditar(p)}
                        aria-label={`Editar ${p.nome}`}
                        title="Editar"
                    >
                        <Pencil size={15} />
                    </motion.button>
                    <motion.button
                        className="icon-btn danger"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onExcluir(p)}
                        aria-label={`Excluir ${p.nome}`}
                        title="Excluir"
                    >
                        <Trash2 size={15} />
                    </motion.button>
                </span>
            )}
        </motion.div>
    );
}));

export { ESTOQUE_BAIXO };
export default ProductRow;
