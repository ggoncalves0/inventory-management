import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const ESTOQUE_BAIXO = 5;
// A barra usa uma escala fixa (e não o maior item da lista): o tamanho não muda quando outro produto muda.
const ESTOQUE_CHEIO = 40;

// Só as exceções ganham selo: a maioria das linhas fica sem marcação, e o que pede atenção salta.
function nivelEstoque(qtd) {
    if (qtd === 0) return { classe: 'esgotado', rotulo: 'Esgotado' };
    if (qtd <= ESTOQUE_BAIXO) return { classe: 'baixo', rotulo: 'Baixo' };
    return null;
}

// Memoizada: digitar na busca só re-renderiza as linhas que mudaram.
const ProductRow = memo(({ produto: p, isAdmin, onEditar, onExcluir }) => {
    const nivel = nivelEstoque(p.quantidade);
    const preenchimento = p.quantidade === 0 ? 0 : Math.max(0.06, Math.min(1, p.quantidade / ESTOQUE_CHEIO));

    return (
        <div role="row" className={`row ${nivel ? nivel.classe : ''}`}>
            <span role="cell" className="td td-id">#{String(p.id).padStart(4, '0')}</span>
            <span role="cell" className="td td-nome" title={p.nome}>{p.nome}</span>
            <span role="cell" className="td td-categoria" title={p.categoria}>{p.categoria}</span>
            <span role="cell" className="td td-quantidade">
                {nivel && <span className={`stock-badge ${nivel.classe}`}>{nivel.rotulo}</span>}
                <span className="stock-bar" aria-hidden="true">
                    <span style={{ transform: `scaleX(${preenchimento})` }} />
                </span>
                <span className="stock-num">
                    {inteiro.format(p.quantidade)}<span className="stock-unit"> un.</span>
                </span>
            </span>
            <span role="cell" className="td td-preco">{moeda.format(p.preco)}</span>
            {isAdmin && (
                <span role="cell" className="td td-acoes">
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onEditar(p)}
                        aria-label={`Editar ${p.nome}`}
                        title="Editar"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => onExcluir(p)}
                        aria-label={`Excluir ${p.nome}`}
                        title="Excluir"
                    >
                        <Trash2 size={15} />
                    </button>
                </span>
            )}
        </div>
    );
});

export { ESTOQUE_BAIXO };
export default ProductRow;
