export const normalizar = (texto) => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const chave = (texto) => normalizar(texto).trim().replace(/\s+/g, ' ');

// Pontua uma grafia para escolher a "oficial" entre variações: a mais usada vence; no empate,
// a que começa com maiúscula e tem acentos ("Periféricos" ganha de "periféricos" e "Perifericos").
function pontos([grafia, usos]) {
    const maiuscula = /^\p{Lu}/u.test(grafia) ? 10 : 0;
    const acentos = grafia.normalize('NFD').length - grafia.length;
    return usos * 100 + maiuscula + acentos;
}

// Seletor, gráfico, filtro e a contagem de categorias tratam "Periféricos", "periféricos" e "Perifericos"
// como uma só. Ao editar um produto, a grafia oficial é a que vai para o banco.
export function canonizarCategorias(produtos) {
    const usosPorGrafiaPorChave = new Map();
    produtos.forEach((p) => {
        const grafia = String(p.categoria).trim().replace(/\s+/g, ' ');
        const k = chave(grafia);
        const grupo = usosPorGrafiaPorChave.get(k) ?? new Map();
        grupo.set(grafia, (grupo.get(grafia) ?? 0) + 1);
        usosPorGrafiaPorChave.set(k, grupo);
    });

    const oficial = new Map();
    usosPorGrafiaPorChave.forEach((grupo, k) => {
        const [melhor] = [...grupo].sort((a, b) => pontos(b) - pontos(a) || a[0].localeCompare(b[0], 'pt-BR'));
        oficial.set(k, melhor[0]);
    });

    return produtos.map((p) => ({ ...p, categoria: oficial.get(chave(p.categoria)) }));
}

export function categoriaExistente(texto, categorias) {
    const k = chave(texto);
    if (!k) return null;
    return categorias.find((c) => chave(c) === k) ?? null;
}
