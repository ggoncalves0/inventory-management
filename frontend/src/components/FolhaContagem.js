import { formatarCodigo } from '../utils/formatos';

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// Folha de contagem física: o que vai para o papel ao imprimir a tela de produtos (ver ProductList e
// o @media print de dashboard.css). Só é montada durante a impressão, para não dobrar o DOM no uso normal.
// É uma <table> de verdade: o navegador repete o cabeçalho em cada página.
const FolhaContagem = ({ produtos, filtros, avisoLimite }) => {
    const unidades = produtos.reduce((soma, p) => soma + p.quantidade, 0);

    return (
        <section className="folha-contagem">
            <header>
                <h1>Folha de contagem de estoque</h1>
                <p>
                    Gerada em {dataHora.format(new Date())} · {filtros} · {inteiro.format(produtos.length)}{' '}
                    {produtos.length === 1 ? 'produto' : 'produtos'}
                </p>
                {avisoLimite && <p>{avisoLimite}</p>}
                <p className="folha-campos">
                    <span>Responsável: ______________________________</span>
                    <span>Data da contagem: ____/____/________</span>
                </p>
            </header>

            <table>
                <thead>
                    <tr>
                        <th scope="col">Código</th>
                        <th scope="col">Produto</th>
                        <th scope="col">Categoria</th>
                        <th scope="col" className="num">No sistema</th>
                        <th scope="col" className="num">Contagem</th>
                    </tr>
                </thead>
                <tbody>
                    {produtos.map((p) => (
                        <tr key={p.id}>
                            <td className="codigo">{formatarCodigo(p.id)}</td>
                            <td>{p.nome}</td>
                            <td>{p.categoria}</td>
                            <td className="num">{inteiro.format(p.quantidade)}</td>
                            <td className="contagem" />
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* fora do <tfoot>, que o navegador repetiria em todas as páginas */}
            <p className="folha-total">
                Total: {inteiro.format(produtos.length)} {produtos.length === 1 ? 'produto' : 'produtos'} ·{' '}
                {inteiro.format(unidades)} unidades no sistema
            </p>
        </section>
    );
};

export default FolhaContagem;
