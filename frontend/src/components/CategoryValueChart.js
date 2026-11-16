import { useEffect, useRef, useState } from 'react';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// Total: mesmo formato do indicador "Valor em estoque" (R$ 1,26 mi)
const moedaTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 2 });
const formatarTotal = (v) => (v >= 100000 ? moedaTotal.format(v) : moeda.format(v));
// Legenda: todos no mesmo formato curto (R$ 1,06 mi · R$ 28,3 mil); o valor exato fica na dica
const moedaLegenda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumSignificantDigits: 3 });
const porcento = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

// Largura mínima (px) de um bloco para caber o "62%" dentro dele com folga
const LARGURA_ROTULO = 44;

// Barra segmentada: um todo (valor do estoque) dividido por categoria.
// `fatias`: [{ nome, valor, cor, tinta, membros? }] já na ordem de exibição; "Outras" tem `membros` e não filtra.
const CategoryValueChart = ({ fatias, total, categoriaAtiva, onSelecionar }) => {
    const barraRef = useRef(null);
    const [largura, setLargura] = useState(0);
    const [destaque, setDestaque] = useState(null);

    const temValor = total > 0;

    // A barra só existe quando há valor: observa de novo quando ela aparece
    useEffect(() => {
        const barra = barraRef.current;
        if (!barra) return undefined;
        const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
        observador.observe(barra);
        return () => observador.disconnect();
    }, [temValor]);

    if (!temValor) return null;

    const comValor = fatias.filter((f) => f.valor > 0);
    const filtrando = categoriaAtiva !== 'Todas';
    const descricao = comValor.map((f) => `${f.nome} ${porcento.format(f.valor / total)}`).join(', ');

    // posição horizontal (centro de cada bloco) para ancorar a dica
    let acumulado = 0;
    const blocos = comValor.map((f) => {
        const parte = f.valor / total;
        const centro = acumulado + parte / 2;
        acumulado += parte;
        return { ...f, parte, centro };
    });
    const bloco = blocos.find((b) => b.nome === destaque);

    const alinhamento = !bloco ? '' : bloco.centro < 0.15 ? 'inicio' : bloco.centro > 0.85 ? 'fim' : '';

    return (
        <section className="chart-card cantoneiras" aria-labelledby="titulo-valor-categoria">
            <div className="chart-head">
                <h2 className="secao" id="titulo-valor-categoria"><span className="secao-num">02</span>Valor por categoria</h2>
                <span className="chart-total" title={moeda.format(total)}>{formatarTotal(total)}</span>
            </div>

            <div className="seg-area">
                <div
                    ref={barraRef}
                    className="seg-bar"
                    role="img"
                    aria-label={`Valor em estoque por categoria: ${descricao}`}
                    onMouseLeave={() => setDestaque(null)}
                >
                    {blocos.map((b) => {
                        const cabe = b.parte * largura >= LARGURA_ROTULO;
                        const apagado = (filtrando && b.nome !== categoriaAtiva) || (destaque && destaque !== b.nome);
                        return (
                            <div
                                key={b.nome}
                                className={`seg ${b.membros ? 'outras' : ''} ${apagado ? 'apagado' : ''}`}
                                style={{ flexGrow: b.valor, '--cor': b.cor, '--tinta': b.tinta }}
                                onMouseEnter={() => setDestaque(b.nome)}
                                onClick={b.membros ? undefined : () => onSelecionar(b.nome)}
                            >
                                {cabe && porcento.format(b.parte)}
                            </div>
                        );
                    })}
                </div>

                {bloco && (
                    <div
                        className={`seg-dica ${alinhamento}`}
                        style={{ left: `${bloco.centro * 100}%` }}
                        aria-hidden="true"
                    >
                        <strong>{bloco.nome}</strong>
                        <span>{moeda.format(bloco.valor)} · {porcento.format(bloco.parte)}</span>
                        {bloco.membros && <span className="seg-dica-membros">{bloco.membros.join(', ')}</span>}
                    </div>
                )}
            </div>

            <ul className="chart-legend">
                {blocos.map((b) => {
                    const conteudo = (
                        <>
                            <span className="cat-dot" style={{ '--cor': b.cor }} aria-hidden="true" />
                            <span className="legend-nome">{b.nome}</span>
                            <span className="legend-valor">{moedaLegenda.format(b.valor)}</span>
                        </>
                    );
                    return (
                        <li key={b.nome}>
                            {b.membros ? (
                                <span className="legend-item" title={b.membros.join(', ')}>{conteudo}</span>
                            ) : (
                                <button
                                    type="button"
                                    className="legend-item"
                                    aria-pressed={categoriaAtiva === b.nome}
                                    aria-label={`${b.nome}: ${moeda.format(b.valor)}, ${porcento.format(b.parte)} do valor. Filtrar a lista`}
                                    onClick={() => onSelecionar(b.nome)}
                                    onMouseEnter={() => setDestaque(b.nome)}
                                    onMouseLeave={() => setDestaque(null)}
                                    onFocus={() => setDestaque(b.nome)}
                                    onBlur={() => setDestaque(null)}
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
