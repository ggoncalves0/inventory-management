import { memo } from 'react';
import { Diff, Pencil, Trash2 } from 'lucide-react';
import { formatarCodigo, inteiro, moeda } from '../utils/formatos';

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
const ProductRow = memo(({ produto: p, isAdmin, onAjustar, onEditar, onExcluir }) => {
    const nivel = nivelEstoque(p.quantidade);
    const preenchimento = p.quantidade === 0 ? 0 : Math.max(0.06, Math.min(1, p.quantidade / ESTOQUE_CHEIO));

    return (
        // data-id: depois de uma exclusão, o foco vai para a linha vizinha (ver ProductList)
        <div role="row" className={`row ${nivel ? nivel.classe : ''}`} data-id={p.id}>
            <span role="cell" className="td td-id">{formatarCodigo(p.id)}</span>
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
                    {/* a ação mais frequente vem primeiro: entrada ou saída sem abrir o formulário completo */}
                    <button
                        type="button"
                        className="icon-btn ajustar"
                        onClick={() => onAjustar(p)}
                        aria-label={`Ajustar estoque de ${p.nome}`}
                        title="Ajustar estoque (entrada ou saída)"
                    >
                        <Diff size={15} />
                    </button>
                    <button
                        type="button"
                        className="icon-btn editar"
                        onClick={() => onEditar(p)}
                        aria-label={`Editar ${p.nome}`}
                        title="Editar"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        type="button"
                        className="icon-btn danger excluir"
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
