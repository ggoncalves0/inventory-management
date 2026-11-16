const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// Total: mesmo formato do indicador "Valor em estoque" (R$ 1,26 mi)
const moedaTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 2 });
const formatarTotal = (v) => (v >= 100000 ? moedaTotal.format(v) : moeda.format(v));
// Linhas: todas no mesmo formato curto (R$ 1,06 mi · R$ 28,3 mil); o valor exato vai no title
const moedaCurta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumSignificantDigits: 3 });
const porcento = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

// Enquanto carrega, o mesmo número de linhas que o gráfico costuma ter (4 categorias + "Outras"):
// o espaço já fica reservado e a lista não pula quando os dados chegam.
const LINHAS_ESQUELETO = 5;

// Barras horizontais em ordem de valor, uma cor só, com nome e valor escritos em cada linha.
// Com dados desiguais (uma categoria com 84%) cada categoria continua legível — numa barra única
// as menores viravam tiras impossíveis de comparar.
// `linhas`: [{ nome, valor, membros? }] em ordem decrescente; "Outras" tem `membros` e não filtra.
// `numero`: número da seção ("01"), decorativo — escondido do leitor de tela.
const CategoryValueChart = ({ linhas, total, categoriaAtiva, onSelecionar, carregando = false, numero }) => {
    if (!carregando && !total) return null;

    const titulo = (
        <h2 className="secao" id="titulo-valor-categoria">
            {numero && <span className="secao-num" aria-hidden="true">{numero}</span>}
            Valor por categoria
        </h2>
    );

    if (carregando) {
        return (
            <section className="chart-card cantoneiras" aria-labelledby="titulo-valor-categoria" aria-busy="true">
                {/* "Total —" como nos indicadores: mantém a altura do cabeçalho igual à do gráfico carregado */}
                <div className="chart-head">{titulo}<span className="chart-total">Total —</span></div>
                <ul className="cat-lista" aria-hidden="true">
                    {Array.from({ length: LINHAS_ESQUELETO }).map((_, i) => (
                        <li key={i} className="cat-esqueleto"><span /><span /></li>
                    ))}
                </ul>
            </section>
        );
    }

    // a maior barra ocupa a trilha inteira; as outras são proporcionais a ela
    const maior = Math.max(...linhas.map((l) => l.valor));

    return (
        <section className="chart-card cantoneiras" aria-labelledby="titulo-valor-categoria">
            <div className="chart-head">
                {titulo}
                <span className="chart-total" title={moeda.format(total)}>Total {formatarTotal(total)}</span>
            </div>

            <ul className="cat-lista">
                {linhas.map((l) => {
                    const parte = l.valor / total;
                    const conteudo = (
                        <>
                            <span className="cat-nome">{l.nome}</span>
                            <span className="cat-trilho" aria-hidden="true">
                                <span style={{ transform: `scaleX(${maior ? l.valor / maior : 0})` }} />
                            </span>
                            <span className="cat-valor">{moedaCurta.format(l.valor)}</span>
                            <span className="cat-parte">{porcento.format(parte)}</span>
                        </>
                    );
                    return (
                        <li key={l.nome}>
                            {l.membros ? (
                                <span className="cat-linha outras" title={`${l.membros.join(', ')}: ${moeda.format(l.valor)}`}>
                                    {conteudo}
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    className="cat-linha"
                                    aria-pressed={categoriaAtiva === l.nome}
                                    aria-label={`${l.nome}: ${moeda.format(l.valor)}, ${porcento.format(parte)} do valor. Filtrar a lista`}
                                    title={`${l.nome}: ${moeda.format(l.valor)}`}
                                    onClick={() => onSelecionar(l.nome)}
                                >
                                    {conteudo}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default CategoryValueChart;
