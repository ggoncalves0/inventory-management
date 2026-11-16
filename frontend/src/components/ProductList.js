import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { motion } from 'motion/react';
import {
    ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, CircleAlert, PackageOpen, Plus, Printer, RefreshCw, Search, TriangleAlert, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import instance, { mensagemDeErro } from '../services/api';
import Logo from './Logo';
import Button from './Button';
import StatCard from './StatCard';
import CategoryValueChart from './CategoryValueChart';
import ThemeToggle from './ThemeToggle';
import ProductRow, { ESTOQUE_BAIXO } from './ProductRow';
import ConfirmModal from './ConfirmModal';
import ProductFormModal from './ProductFormModal';
import AjusteEstoqueModal from './AjusteEstoqueModal';
import FolhaContagem from './FolhaContagem';
import useMediaQuery from '../utils/useMediaQuery';
import useTituloDaPagina from '../utils/useTituloDaPagina';
import { canonizarCategorias, normalizar } from '../utils/categorias';
import { lerRascunho, limparRascunho } from '../utils/rascunho';
import { formatarValorEstoque, inteiro, moeda } from '../utils/formatos';
import '../styles/dashboard.css';

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

// A lista é exibida em blocos: montar 1.000 linhas de uma vez travava a tela por 1–1,5 s num notebook simples
const PASSO = 100;

// O gráfico mostra as 4 categorias de maior valor; o resto vira uma linha "Outras".
// Com 5 linhas ele tem a altura dos indicadores 2×2 ao lado dele, na faixa.
const MAX_LINHAS = 4;
// Acima disso o gráfico fica na faixa, ao lado dos indicadores; abaixo, depois da lista (mesmo corte do CSS)
const TELA_LARGA = '(min-width: 1001px)';

const COLUNAS = [
    { campo: 'id', rotulo: 'ID' },
    { campo: 'nome', rotulo: 'Produto' },
    { campo: 'categoria', rotulo: 'Categoria' },
    { campo: 'quantidade', rotulo: 'Estoque' },
    { campo: 'preco', rotulo: 'Preço' },
];

// No modo cartões (telas estreitas) o cabeçalho da tabela some e a ordenação vem deste select
const ORDENACOES = [
    { valor: 'id-asc', rotulo: 'ID (crescente)' },
    { valor: 'id-desc', rotulo: 'ID (decrescente)' },
    { valor: 'nome-asc', rotulo: 'Nome (A–Z)' },
    { valor: 'nome-desc', rotulo: 'Nome (Z–A)' },
    { valor: 'categoria-asc', rotulo: 'Categoria (A–Z)' },
    { valor: 'categoria-desc', rotulo: 'Categoria (Z–A)' },
    { valor: 'quantidade-asc', rotulo: 'Estoque (menor primeiro)' },
    { valor: 'quantidade-desc', rotulo: 'Estoque (maior primeiro)' },
    { valor: 'preco-asc', rotulo: 'Preço (menor primeiro)' },
    { valor: 'preco-desc', rotulo: 'Preço (maior primeiro)' },
];

const ProductList = () => {
    const { usuario, isAdmin, logout } = useAuth();
    const { mostrarToast } = useToast();

    const [produtos, setProdutos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [atualizadoEm, setAtualizadoEm] = useState(null);
    // Total real no servidor (header X-Total-Count): a listagem traz no máximo 1.000 produtos
    const [totalNoServidor, setTotalNoServidor] = useState(null);
    // Não vira toast: a própria lista mostra o erro da carga
    const [erroCarga, setErroCarga] = useState(null);
    const [busca, setBusca] = useState('');
    const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
    const [somenteBaixo, setSomenteBaixo] = useState(false);
    const [ordem, setOrdem] = useState({ campo: 'id', direcao: 'asc' });
    const [formAberto, setFormAberto] = useState(false);
    const [produtoEditado, setProdutoEditado] = useState(null);
    const [produtoExcluir, setProdutoExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const [rascunho, setRascunho] = useState(null);
    const restaurouRascunho = useRef(false);
    // Linha que recebe o foco depois de uma exclusão (o botão que abriu o diálogo some com a linha)
    const vizinhoAoExcluir = useRef(null);
    const produtoEditadoRef = useRef(null);
    produtoEditadoRef.current = produtoEditado;
    const buscaRef = useRef(null);
    const painelRef = useRef(null);
    const inventarioRef = useRef(null);
    const largo = useMediaQuery(TELA_LARGA);
    useTituloDaPagina('Produtos');
    // Mantém o nome no modal de exclusão enquanto ele anima a saída
    const ultimoExcluir = useRef(null);
    if (produtoExcluir) ultimoExcluir.current = produtoExcluir;
    // O último fica guardado enquanto o modal anima a saída
    const [produtoAjuste, setProdutoAjuste] = useState(null);
    const ultimoAjuste = useRef(null);
    if (produtoAjuste) ultimoAjuste.current = produtoAjuste;
    const [imprimindo, setImprimindo] = useState(false);
    const indiceParaFocar = useRef(null);
    const sentinelaRef = useRef(null);

    const buscarProdutos = useCallback(async () => {
        try {
            const { data, headers } = await instance.get('/produtos');
            const total = Number(headers['x-total-count']);
            setTotalNoServidor(headers['x-total-count'] != null && Number.isFinite(total) ? total : null);
            setProdutos(canonizarCategorias(data.map((p) => ({ ...p, preco: Number(p.preco) }))));
            setAtualizadoEm(new Date());
            setErroCarga(null);
        } catch (e) {
            // 401 já leva de volta ao login (interceptor); o resto aparece na própria lista
            if (e.response?.status !== 401) setErroCarga(mensagemDeErro(e, 'Erro desconhecido.'));
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { buscarProdutos(); }, [buscarProdutos]);

    // Atualização manual: o ícone gira por pelo menos 600 ms, senão uma resposta rápida não dá retorno visível
    const atualizarLista = async () => {
        if (atualizando) return;
        setAtualizando(true);
        await Promise.all([buscarProdutos(), new Promise((resolve) => setTimeout(resolve, 600))]);
        setAtualizando(false);
    };

    // Atalho "/" para focar a busca (fora de campos e sem modal aberto, para o foco não escapar dele)
    useEffect(() => {
        const aoTeclar = (e) => {
            const digitando = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
            const modalAberto = document.querySelector('[aria-modal="true"]');
            if (e.key === '/' && !digitando && !modalAberto) {
                e.preventDefault();
                buscaRef.current?.focus();
            }
        };
        document.addEventListener('keydown', aoTeclar);
        return () => document.removeEventListener('keydown', aoTeclar);
    }, []);

    const categorias = useMemo(
        () => [...new Set(produtos.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
        [produtos]
    );
    // A categoria filtrada sumiu (o último produto dela foi excluído ou mudou de categoria): sem isso o
    // select mostra "Todas" enquanto a lista continua filtrada por ela, vazia.
    if (!carregando && categoriaAtiva !== 'Todas' && !categorias.includes(categoriaAtiva)) setCategoriaAtiva('Todas');

    const estatisticas = useMemo(() => ({
        total: produtos.length,
        unidades: produtos.reduce((s, p) => s + p.quantidade, 0),
        valor: produtos.reduce((s, p) => s + p.quantidade * p.preco, 0),
        baixo: produtos.filter((p) => p.quantidade <= ESTOQUE_BAIXO).length,
        esgotados: produtos.filter((p) => p.quantidade === 0).length,
    }), [produtos]);

    // Valor por categoria, em ordem decrescente (sobre todos os produtos, não só os filtrados).
    // Uma categoria sozinha não vira "Outras (1)": se sobrar só uma, ela aparece com o próprio nome.
    const linhasValor = useMemo(() => {
        const valores = new Map();
        produtos.forEach((p) => valores.set(p.categoria, (valores.get(p.categoria) || 0) + p.quantidade * p.preco));
        const ordenadas = [...valores]
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
        const limite = ordenadas.length === MAX_LINHAS + 1 ? ordenadas.length : MAX_LINHAS;
        const lista = ordenadas.slice(0, limite).map(([nome, valor]) => ({ nome, valor }));
        const resto = ordenadas.slice(limite);
        if (resto.length) {
            lista.push({
                nome: `Outras (${resto.length})`,
                valor: resto.reduce((s, [, v]) => s + v, 0),
                membros: resto.map(([nome]) => nome),
            });
        }
        return lista;
    }, [produtos]);

    // Critérios adiados: o campo de busca, o seletor e as setas de ordenação respondem na hora;
    // a lista acompanha logo em seguida, numa renderização que pode ser interrompida (não trava a digitação).
    const buscaAdiada = useDeferredValue(busca);
    const categoriaAdiada = useDeferredValue(categoriaAtiva);
    const baixoAdiado = useDeferredValue(somenteBaixo);
    const ordemAdiada = useDeferredValue(ordem);
    const listaPendente = busca !== buscaAdiada || categoriaAtiva !== categoriaAdiada
        || somenteBaixo !== baixoAdiado || ordem !== ordemAdiada;

    const visiveis = useMemo(() => {
        const termo = normalizar(buscaAdiada.trim().replace(/^#/, ''));
        const filtrados = produtos.filter((p) => {
            if (categoriaAdiada !== 'Todas' && p.categoria !== categoriaAdiada) return false;
            if (baixoAdiado && p.quantidade > ESTOQUE_BAIXO) return false;
            if (!termo) return true;
            const ehCodigo = /^\d+$/.test(termo) && Number(termo) === p.id;
            return ehCodigo || normalizar(p.nome).includes(termo) || normalizar(p.categoria).includes(termo);
        });
        const fator = ordemAdiada.direcao === 'asc' ? 1 : -1;
        return filtrados.sort((a, b) => {
            const [x, y] = [a[ordemAdiada.campo], b[ordemAdiada.campo]];
            return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * fator;
        });
    }, [produtos, buscaAdiada, categoriaAdiada, baixoAdiado, ordemAdiada]);

    // Mudou a busca, o filtro ou a ordem: volta ao 1º bloco. Ajuste de estado durante a renderização (padrão
    // do React), não efeito: sem renderização intermediária com o limite antigo, e voltar a critérios
    // anteriores (ex.: limpar a busca) não restaura o limite que eles tinham.
    const chaveDaLista = `${buscaAdiada}|${categoriaAdiada}|${baixoAdiado}|${ordemAdiada.campo}|${ordemAdiada.direcao}`;
    const [blocos, setBlocos] = useState({ chave: chaveDaLista, limite: PASSO });
    if (blocos.chave !== chaveDaLista) setBlocos({ chave: chaveDaLista, limite: PASSO });
    const limite = blocos.chave === chaveDaLista ? blocos.limite : PASSO;
    const exibidos = visiveis.slice(0, limite);
    const restantes = visiveis.length - Math.min(limite, visiveis.length);

    const mostrarMais = useCallback((porTeclado = false) => {
        if (porTeclado) indiceParaFocar.current = limite;
        setBlocos({ chave: chaveDaLista, limite: limite + PASSO });
    }, [chaveDaLista, limite]);

    // Quem usou o botão pelo teclado continua lendo de onde parou: foco no 1º botão da 1ª linha nova
    useEffect(() => {
        if (indiceParaFocar.current == null) return;
        const linha = document.querySelectorAll('.table-body .row:not(.skeleton)')[indiceParaFocar.current];
        indiceParaFocar.current = null;
        linha?.querySelector('button')?.focus();
    }, [limite]);

    // Rolando até o fim da lista, o próximo bloco entra sozinho (o botão continua lá para teclado e leitores de tela)
    useEffect(() => {
        const sentinela = sentinelaRef.current;
        if (!sentinela || restantes <= 0) return undefined;
        const observador = new IntersectionObserver(([entrada]) => {
            if (entrada.isIntersecting) mostrarMais();
        }, { rootMargin: '600px 0px' });
        observador.observe(sentinela);
        return () => observador.disconnect();
    }, [restantes, mostrarMais]);

    // Impressão (Ctrl+P ou o botão): monta a folha de contagem antes de o navegador gerar as páginas.
    // flushSync: a atualização precisa estar na tela quando o beforeprint termina.
    useEffect(() => {
        const antes = () => flushSync(() => setImprimindo(true));
        const depois = () => setImprimindo(false);
        window.addEventListener('beforeprint', antes);
        window.addEventListener('afterprint', depois);
        return () => {
            window.removeEventListener('beforeprint', antes);
            window.removeEventListener('afterprint', depois);
        };
    }, []);

    const alternarOrdem = (campo) => {
        setOrdem((o) => ({ campo, direcao: o.campo === campo && o.direcao === 'asc' ? 'desc' : 'asc' }));
    };

    const escolherOrdem = (e) => {
        const [campo, direcao] = e.target.value.split('-');
        setOrdem({ campo, direcao });
    };

    // Se os resultados ficariam no pé da tela (celular), rola até a lista
    const alternarSomenteBaixo = () => {
        const ativar = !somenteBaixo;
        setSomenteBaixo(ativar);
        const painel = painelRef.current;
        const tabela = painel?.querySelector('.table');
        if (ativar && tabela && tabela.getBoundingClientRect().top > window.innerHeight * 0.75) {
            const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            painel.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
        }
    };

    const alternarCategoria = useCallback((nome) => {
        setCategoriaAtiva((atual) => (atual === nome ? 'Todas' : nome));
    }, []);

    const pularParaLista = (e) => {
        e.preventDefault();
        inventarioRef.current?.focus();
    };

    const limparFiltros = () => {
        setBusca('');
        setCategoriaAtiva('Todas');
        setSomenteBaixo(false);
    };

    const abrirNovo = () => { setRascunho(null); setProdutoEditado(null); setFormAberto(true); };
    const abrirEdicao = useCallback((p) => { setRascunho(null); setProdutoEditado(p); setFormAberto(true); }, []);
    // Fechar ou salvar descarta o rascunho; só a sessão expirada (que desmonta a tela) o mantém
    const fecharForm = useCallback(() => { limparRascunho(); setFormAberto(false); }, []);

    const aoSalvar = (msg) => {
        limparRascunho();
        setFormAberto(false);
        buscarProdutos();
        mostrarToast('sucesso', msg);
    };

    // A sessão expirou com o formulário aberto: depois do novo login, reabre o que estava sendo preenchido
    useEffect(() => {
        if (restaurouRascunho.current || carregando || erroCarga || !usuario) return;
        restaurouRascunho.current = true;
        const salvo = lerRascunho();
        if (!salvo) return;
        limparRascunho();
        if (!salvo.alterados) return; // formato antigo (antes de guardar só os campos alterados): descarta
        if (salvo.usuario !== usuario.username) return; // de outra pessoa nesta aba: descarta
        if (salvo.produtoId != null) {
            const produto = produtos.find((p) => p.id === salvo.produtoId);
            if (!produto) {
                mostrarToast('erro', 'O produto que você estava editando não existe mais.');
                return;
            }
            setProdutoEditado(produto);
        } else {
            setProdutoEditado(null);
        }
        setRascunho(salvo.alterados);
        setFormAberto(true);
    }, [carregando, erroCarga, usuario, produtos, mostrarToast]);

    // Depois de excluir, o foco vai para o "Excluir" da linha vizinha (ou para o título da lista, se ficou vazia):
    // quem exclui vários itens em sequência continua no mesmo lugar, sem voltar ao topo da página.
    const focoDepoisDeExcluir = useCallback(() => {
        const id = vizinhoAoExcluir.current;
        return (id != null && document.querySelector(`.row[data-id="${id}"] .icon-btn.excluir`)) || inventarioRef.current;
    }, []);

    // Formulário aberto sem um botão de origem (reaberto pelo rascunho, ou no Safari, que não foca botões
    // ao clicar): ao fechar, o foco vai para o "Editar" da linha ou para o "Novo produto".
    const focoDepoisDoFormulario = useCallback(() => {
        const id = produtoEditadoRef.current?.id;
        return (id != null && document.querySelector(`.row[data-id="${id}"] .icon-btn.editar`))
            || document.querySelector('.page-head .btn-primary');
    }, []);

    const abrirAjuste = useCallback((p) => setProdutoAjuste(p), []);
    const fecharAjuste = useCallback(() => setProdutoAjuste(null), []);
    // Sem botão de origem (Safari não foca botões ao clicar): o foco volta ao "Ajustar" da linha
    const focoDepoisDoAjuste = useCallback(() => {
        const id = ultimoAjuste.current?.id;
        return id != null ? document.querySelector(`.row[data-id="${id}"] .icon-btn.ajustar`) : null;
    }, []);

    const aoAjustar = ({ id, nome, tipo, n, de, para, mudou }) => {
        setProdutos((lista) => lista.map((p) => (p.id === id ? { ...p, quantidade: para } : p)));
        setProdutoAjuste(null);
        const movimento = tipo === 'entrada' ? 'Entrada' : 'Saída';
        // Se alguém tinha mexido no estoque antes, o ajuste valeu sobre o valor novo: avisa qual era
        const aviso = mudou ? ` O estoque já estava em ${inteiro.format(de)} quando você salvou.` : '';
        // em palavras, não com seta: o toast é lido pelo leitor de tela
        mostrarToast('sucesso', `${movimento} de ${inteiro.format(n)} un. em "${nome}": estoque de ${inteiro.format(de)} para ${inteiro.format(para)}.${aviso}`);
    };

    const confirmarExclusao = async () => {
        const alvo = produtoExcluir;
        const i = visiveis.findIndex((p) => p.id === alvo.id);
        vizinhoAoExcluir.current = (visiveis[i + 1] ?? visiveis[i - 1])?.id ?? null;
        setExcluindo(true);
        try {
            await instance.delete(`/produtos/${alvo.id}`);
            setProdutos((lista) => lista.filter((p) => p.id !== alvo.id));
            mostrarToast('sucesso', `"${alvo.nome}" foi excluído.`);
        } catch (e) {
            const status = e.response?.status;
            if (status === 404) {
                setProdutos((lista) => lista.filter((p) => p.id !== alvo.id));
            } else {
                vizinhoAoExcluir.current = alvo.id;
            }
            if (status !== 401) mostrarToast('erro', mensagemDeErro(e, 'Erro ao excluir produto. Tente novamente.'));
        } finally {
            setExcluindo(false);
            setProdutoExcluir(null);
        }
    };

    const filtroAtivo = busca || categoriaAtiva !== 'Todas' || somenteBaixo;
    const listaCortada = totalNoServidor != null && totalNoServidor > produtos.length;
    const descricaoFiltros = [
        categoriaAdiada !== 'Todas' ? `Categoria: ${categoriaAdiada}` : 'Todas as categorias',
        buscaAdiada.trim() && `Busca: “${buscaAdiada.trim()}”`,
        baixoAdiado && `Só estoque baixo (até ${ESTOQUE_BAIXO} un.)`,
        `Ordem: ${ORDENACOES.find((o) => o.valor === `${ordemAdiada.campo}-${ordemAdiada.direcao}`)?.rotulo}`,
    ].filter(Boolean).join(' · ');
    // Sem dados confiáveis (carregando, ou a primeira carga falhou): os indicadores mostram "—", não zero
    const semDados = carregando || (erroCarga && produtos.length === 0);
    const falhouSemDados = !carregando && erroCarga && produtos.length === 0;
    const PENDENTE = '—';
    // Enquanto carrega, o esqueleto do gráfico reserva o espaço dele
    const temGrafico = carregando || estatisticas.valor > 0;
    const graficoNaFaixa = largo && temGrafico;
    const grafico = (
        <CategoryValueChart
            linhas={linhasValor}
            total={estatisticas.valor}
            categoriaAtiva={categoriaAtiva}
            onSelecionar={alternarCategoria}
            carregando={carregando}
            numero="01"
        />
    );

    const { baixo, esgotados } = estatisticas;
    let detalheBaixo = `até ${ESTOQUE_BAIXO} unidades`;
    if (esgotados > 0) detalheBaixo = `${esgotados} ${esgotados === 1 ? 'esgotado' : 'esgotados'}`;

    return (
        // motion.div só para a transição de saída ao trocar de rota (sair)
        <motion.div className="dashboard" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            <a className="pular" href="#secao-inventario" onClick={pularParaLista}>Pular para a lista de produtos</a>

            <header className="topbar">
                <div className="topbar-inner">
                    <Logo />
                    <div className="topbar-right">
                        <span className="user-meta">
                            <strong>{usuario?.username}</strong>
                            <span className="role">{isAdmin ? 'Administrador' : 'Somente leitura'}</span>
                        </span>
                        <ThemeToggle />
                        <Button variante="ghost" className="btn-sm" onClick={logout}>Sair</Button>
                    </div>
                </div>
            </header>

            {/* Título e indicadores dentro do <main>: quem navega por regiões não pula o resumo */}
            <main>
                <div className="faixa">
                    <div className="faixa-inner">
                        <section className="page-head">
                            <div className="page-titulo">
                                <h1>Produtos</h1>
                                <p className="page-sub">
                                    {carregando && 'Carregando o estoque…'}
                                    {!carregando && (atualizadoEm
                                        ? `Estoque atualizado às ${hora.format(atualizadoEm)}`
                                        : 'Não foi possível carregar o estoque.')}
                                </p>
                            </div>
                            {isAdmin && (
                                <Button icon={Plus} onClick={abrirNovo}>Novo produto</Button>
                            )}
                        </section>

                        {listaCortada && (
                            <p className="aviso-limite" role="status">
                                <TriangleAlert size={16} aria-hidden="true" />
                                <span>
                                    O estoque tem {inteiro.format(totalNoServidor)} produtos, mas a lista carrega só
                                    os {inteiro.format(produtos.length)} primeiros (por código). Indicadores, gráfico
                                    e busca consideram só esses.
                                </span>
                            </p>
                        )}

                        {/* Telas largas: indicadores 2×2 e gráfico lado a lado, para a lista caber na primeira tela */}
                        <div className={`resumo ${graficoNaFaixa ? 'com-grafico' : ''}`}>
                            <section className={`stats-grid ${semDados ? 'pendente' : ''}`} aria-label="Resumo do estoque" aria-busy={carregando || undefined}>
                                {/* com a lista cortada, o total de produtos vem do servidor (é o único número exato) */}
                                <StatCard rotulo="Produtos" valor={semDados ? PENDENTE : inteiro.format(listaCortada ? totalNoServidor : estatisticas.total)}
                                    detalhe={semDados ? undefined
                                        : listaCortada ? `${inteiro.format(produtos.length)} carregados`
                                        : `${categorias.length} ${categorias.length === 1 ? 'categoria' : 'categorias'}`} />
                                <StatCard rotulo="Unidades" valor={semDados ? PENDENTE : inteiro.format(estatisticas.unidades)} />
                                <StatCard rotulo="Valor em estoque" valor={semDados ? PENDENTE : formatarValorEstoque(estatisticas.valor)}
                                    titulo={semDados ? undefined : moeda.format(estatisticas.valor)}
                                    detalhe={semDados ? undefined : 'quantidade × preço'} />
                                <StatCard rotulo="Estoque baixo" valor={semDados ? PENDENTE : inteiro.format(baixo)}
                                    detalhe={semDados ? undefined : detalheBaixo}
                                    alerta={!semDados && baixo > 0}
                                    onClick={!semDados && baixo > 0 ? alternarSomenteBaixo : undefined}
                                    ativo={somenteBaixo}
                                    acao={!semDados && baixo > 0 ? (somenteBaixo ? 'Limpar filtro' : 'Ver itens') : undefined} />
                            </section>
                            {graficoNaFaixa && grafico}
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <section ref={painelRef} className="panel" aria-labelledby="secao-inventario">
                        {/* sem gráfico (01) o inventário assume o número dele; tabIndex -1: alvo do "Pular para a lista" */}
                        <h2 className="secao" id="secao-inventario" tabIndex={-1} ref={inventarioRef}>
                            <span className="secao-num" aria-hidden="true">{temGrafico ? '02' : '01'}</span>Inventário
                        </h2>
                        <div className="toolbar">
                            <div className="search">
                                <Search size={16} className="search-icon" aria-hidden="true" />
                                <input
                                    ref={buscaRef}
                                    type="search"
                                    placeholder="Buscar por nome, categoria ou ID"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    aria-label="Buscar produtos"
                                    maxLength={100}
                                />
                                {busca
                                    ? <button type="button" className="search-clear" onClick={() => setBusca('')} aria-label="Limpar busca"><X size={14} /></button>
                                    : <kbd>/</kbd>}
                            </div>
                            <div className={`campo-select categoria-select ${categoriaAtiva !== 'Todas' ? 'ativo' : ''}`}>
                                <select aria-label="Filtrar por categoria" value={categoriaAtiva} onChange={(e) => setCategoriaAtiva(e.target.value)}>
                                    <option value="Todas">Todas as categorias</option>
                                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={15} className="sort-seta" aria-hidden="true" />
                            </div>
                            <div className="campo-select sort-select">
                                <select aria-label="Ordenar por" value={`${ordem.campo}-${ordem.direcao}`} onChange={escolherOrdem}>
                                    {ORDENACOES.map(({ valor, rotulo }) => <option key={valor} value={valor}>{rotulo}</option>)}
                                </select>
                                <ChevronDown size={15} className="sort-seta" aria-hidden="true" />
                            </div>
                            <Button
                                variante="ghost"
                                icon={RefreshCw}
                                className={`btn-icon ${atualizando ? 'girando' : ''}`}
                                onClick={atualizarLista}
                                aria-label={atualizando ? 'Atualizando a lista' : 'Atualizar lista'}
                                aria-busy={atualizando || undefined}
                                title="Atualizar lista"
                            />
                            <Button
                                variante="ghost"
                                icon={Printer}
                                className="btn-icon"
                                onClick={() => window.print()}
                                disabled={carregando || visiveis.length === 0}
                                aria-label="Imprimir folha de contagem"
                                title="Imprimir folha de contagem"
                            />
                        </div>

                        {!carregando && erroCarga && produtos.length > 0 && (
                            <div className="aviso-carga" role="status">
                                <CircleAlert size={16} aria-hidden="true" />
                                <span>
                                    Não foi possível atualizar a lista ({erroCarga.replace(/\.$/, '')}).
                                    {atualizadoEm && ` Mostrando os dados das ${hora.format(atualizadoEm)}.`}
                                </span>
                                <button type="button" onClick={atualizarLista} disabled={atualizando}>
                                    {atualizando ? 'Tentando…' : 'Tentar de novo'}
                                </button>
                            </div>
                        )}

                        {somenteBaixo && (
                            <div className="filtro-ativo">
                                <span>Mostrando só itens com até {ESTOQUE_BAIXO} unidades.</span>
                                <button type="button" onClick={() => setSomenteBaixo(false)}>Limpar</button>
                            </div>
                        )}

                        <div
                            className={`table ${isAdmin ? 'with-actions' : ''} ${listaPendente ? 'pendente' : ''}`}
                            role="table"
                            aria-label="Produtos"
                            aria-busy={listaPendente || undefined}
                        >
                            <div className="table-head" role="row">
                                {COLUNAS.map(({ campo, rotulo }) => {
                                    const ativo = ordem.campo === campo;
                                    const Icone = !ativo ? ArrowUpDown : ordem.direcao === 'asc' ? ArrowUp : ArrowDown;
                                    return (
                                        <div
                                            key={campo}
                                            role="columnheader"
                                            aria-sort={ativo ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : undefined}
                                            className={`th th-${campo} ${ativo ? 'sorted' : ''}`}
                                        >
                                            <button type="button" className="th-btn" onClick={() => alternarOrdem(campo)}>
                                                {rotulo} <Icone size={13} aria-hidden="true" />
                                            </button>
                                        </div>
                                    );
                                })}
                                {isAdmin && <span className="th th-acoes" role="columnheader"><span className="sr-only">Ações</span></span>}
                            </div>

                            <div className="table-body" role="rowgroup">
                                {carregando && Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="row skeleton" aria-hidden="true">
                                        <span /><span /><span /><span /><span />{isAdmin && <span />}
                                    </div>
                                ))}

                                {!carregando && exibidos.map((p) => (
                                    <ProductRow
                                        key={p.id}
                                        produto={p}
                                        isAdmin={isAdmin}
                                        onAjustar={abrirAjuste}
                                        onEditar={abrirEdicao}
                                        onExcluir={setProdutoExcluir}
                                    />
                                ))}

                                {falhouSemDados && (
                                    <div className="empty-state erro-carga" role="alert">
                                        <CircleAlert size={28} aria-hidden="true" />
                                        <strong>Não foi possível carregar o estoque</strong>
                                        <p>{erroCarga.replace(/\.?$/, '.')} Isso não quer dizer que o estoque esteja vazio.</p>
                                        <Button icon={RefreshCw} className="btn-sm" onClick={atualizarLista} carregando={atualizando}>
                                            Tentar de novo
                                        </Button>
                                    </div>
                                )}

                                {!carregando && !falhouSemDados && visiveis.length === 0 && (
                                    <div className="empty-state">
                                        <PackageOpen size={28} aria-hidden="true" />
                                        <strong>{filtroAtivo ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</strong>
                                        <p>{filtroAtivo
                                            ? 'Tente outro termo ou limpe os filtros.'
                                            : isAdmin ? 'Cadastre o primeiro item do estoque.' : 'Ainda não há itens no estoque.'}
                                        </p>
                                        {filtroAtivo && (
                                            <Button variante="ghost" className="btn-sm" onClick={limparFiltros}>
                                                Limpar filtros
                                            </Button>
                                        )}
                                        {!filtroAtivo && isAdmin && (
                                            <Button icon={Plus} className="btn-sm" onClick={abrirNovo}>Novo produto</Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {!carregando && restantes > 0 && (
                            <div className="mostrar-mais" ref={sentinelaRef}>
                                <Button
                                    variante="ghost"
                                    onClick={(e) => mostrarMais(e.detail === 0)}
                                >
                                    Mostrar mais {inteiro.format(Math.min(PASSO, restantes))}
                                    {' '}(faltam {inteiro.format(restantes)})
                                </Button>
                            </div>
                        )}

                        {!carregando && produtos.length > 0 && (
                            <p className="table-footer" aria-live="polite" aria-atomic="true">
                                {listaCortada
                                    ? `${inteiro.format(visiveis.length)} de ${inteiro.format(produtos.length)} carregados · ${inteiro.format(totalNoServidor)} no estoque`
                                    : `${inteiro.format(visiveis.length)} de ${inteiro.format(produtos.length)} produtos`}
                            </p>
                        )}
                    </section>

                    {!graficoNaFaixa && grafico}
                </div>
            </main>

            <ProductFormModal
                aberto={formAberto}
                produto={produtoEditado}
                onClose={fecharForm}
                onSaved={aoSalvar}
                categorias={categorias}
                rascunho={rascunho}
                focoAoFechar={focoDepoisDoFormulario}
            />
            <ConfirmModal
                aberto={!!produtoExcluir}
                titulo="Excluir produto?"
                mensagem={`"${ultimoExcluir.current?.nome}" será removido permanentemente. Essa ação não pode ser desfeita.`}
                onConfirm={confirmarExclusao}
                onCancel={() => setProdutoExcluir(null)}
                carregando={excluindo}
                focoAoFechar={focoDepoisDeExcluir}
            />
            <AjusteEstoqueModal
                aberto={!!produtoAjuste}
                produto={ultimoAjuste.current}
                onClose={fecharAjuste}
                onAjustado={aoAjustar}
                focoAoFechar={focoDepoisDoAjuste}
            />

            {imprimindo && (
                <FolhaContagem
                    produtos={visiveis}
                    filtros={descricaoFiltros}
                    avisoLimite={listaCortada
                        ? `Atenção: o estoque tem ${inteiro.format(totalNoServidor)} produtos; esta folha traz só os ${inteiro.format(produtos.length)} primeiros carregados.`
                        : null}
                />
            )}
        </motion.div>
    );
};

export default ProductList;
