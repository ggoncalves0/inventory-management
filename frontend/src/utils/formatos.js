export const formatarCodigo = (id) => `#${String(id).padStart(4, '0')}`;

export const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
export const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const moedaCompacta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 2 });
// A partir de R$ 100 mil o valor completo não cabe no indicador nem no total do gráfico, que precisam
// mostrar o mesmo número: vira "R$ 1,26 mi" (o exato fica no title)
export const formatarValorEstoque = (v) => (v >= 100000 ? moedaCompacta.format(v) : moeda.format(v));
