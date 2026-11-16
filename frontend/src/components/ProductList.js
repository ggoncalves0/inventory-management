import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
    ArrowDown, ArrowUp, ArrowUpDown, Boxes, ChevronDown, Layers, LogOut, PackageOpen,
    Plus, RefreshCw, Search, ShieldCheck, TriangleAlert, Wallet, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import instance, { mensagemDeErro } from '../services/api';
import Logo from './Logo';
import Button from './Button';
import StatCard from './StatCard';
import ProductRow, { ESTOQUE_BAIXO } from './ProductRow';
import ConfirmModal from './ConfirmModal';
import ProductFormModal from './ProductFormModal';
import '../styles/dashboard.css';


const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moedaCompacta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 2 });
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatarMoeda = (v) => moeda.format(v);
// A partir de R$ 100 mil o valor completo não cabe no cartão: vira "R$ 1,26 mi" (o exato fica no title)
const formatarValorEstoque = (v) => (v >= 100000 ? moedaCompacta.format(v) : moeda.format(v));
const formatarInteiro = (v) => inteiro.format(Math.round(v));

const normalizar = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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

const pagina = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const bloco = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } },
};

const ProductList = () => {
    const { usuario, isAdmin, logout } = useAuth();
    const { mostrarToast } = useToast();

    const [produtos, setProdutos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [atualizadoEm, setAtualizadoEm] = useState(null);
    const [busca, setBusca] = useState('');
    const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
    const [somenteBaixo, setSomenteBaixo] = useState(false);
    const [ordem, setOrdem] = useState({ campo: 'id', direcao: 'asc' });
    const [formAberto, setFormAberto] = useState(false);
    const [produtoEditado, setProdutoEditado] = useState(null);
    const [produtoExcluir, setProdutoExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const buscaRef = useRef(null);
    const painelRef = useRef(null);
    // Mantém o nome no modal de exclusão enquanto ele anima a saída
    const ultimoExcluir = useRef(null);
    if (produtoExcluir) ultimoExcluir.current = produtoExcluir;

    const buscarProdutos = useCallback(async () => {
        try {
            const { data } = await instance.get('/produtos');
            setProdutos(data.map((p) => ({ ...p, preco: Number(p.preco) })));
            setAtualizadoEm(new Date());
        } catch (e) {
            if (e.response?.status !== 401) mostrarToast('erro', mensagemDeErro(e, 'Erro ao carregar produtos.'));
        } finally {
            setCarregando(false);
        }
    }, [mostrarToast]);

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

    const estatisticas = useMemo(() => ({
        total: produtos.length,
        unidades: produtos.reduce((s, p) => s + p.quantidade, 0),
        valor: produtos.reduce((s, p) => s + p.quantidade * p.preco, 0),
        baixo: produtos.filter((p) => p.quantidade <= ESTOQUE_BAIXO).length,
        esgotados: produtos.filter((p) => p.quantidade === 0).length,
    }), [produtos]);

    const visiveis = useMemo(() => {
        const termo = normalizar(busca.trim().replace(/^#/, ''));
        const filtrados = produtos.filter((p) => {
            if (categoriaAtiva !== 'Todas' && p.categoria !== categoriaAtiva) return false;
            if (somenteBaixo && p.quantidade > ESTOQUE_BAIXO) return false;
            if (!termo) return true;
            return String(p.id) === termo || normalizar(p.nome).includes(termo) || normalizar(p.categoria).includes(termo);
        });
        const fator = ordem.direcao === 'asc' ? 1 : -1;
        return filtrados.sort((a, b) => {
            const [x, y] = [a[ordem.campo], b[ordem.campo]];
            return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * fator;
        });
    }, [produtos, busca, categoriaAtiva, somenteBaixo, ordem]);

    const alternarOrdem = (campo) => {
        setOrdem((o) => ({ campo, direcao: o.campo === campo && o.direcao === 'asc' ? 'desc' : 'asc' }));
    };

    const escolherOrdem = (e) => {
        const [campo, direcao] = e.target.value.split('-');
        setOrdem({ campo, direcao });
    };

    // Ligado pelo cartão "Estoque baixo". Se os resultados ficariam no pé da tela (celular), rola até a lista.
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

    const limparFiltros = () => {
        setBusca('');
        setCategoriaAtiva('Todas');
        setSomenteBaixo(false);
    };

    const abrirNovo = () => { setProdutoEditado(null); setFormAberto(true); };
    const abrirEdicao = useCallback((p) => { setProdutoEditado(p); setFormAberto(true); }, []);
    const fecharForm = useCallback(() => setFormAberto(false), []);

    const aoSalvar = (msg) => {
        setFormAberto(false);
        buscarProdutos();
        mostrarToast('sucesso', msg);
    };

    const confirmarExclusao = async () => {
        const alvo = produtoExcluir;
        setExcluindo(true);
        try {
            await instance.delete(`/produtos/${alvo.id}`);
            setProdutos((lista) => lista.filter((p) => p.id !== alvo.id));
            mostrarToast('sucesso', `"${alvo.nome}" foi excluído.`);
        } catch (e) {
            mostrarToast('erro', mensagemDeErro(e, 'Erro ao excluir produto. Tente novamente.'));
        } finally {
            setExcluindo(false);
            setProdutoExcluir(null);
        }
    };

    const filtroAtivo = busca || categoriaAtiva !== 'Todas' || somenteBaixo;
    const inicial = (usuario?.username || '?').charAt(0).toUpperCase();

    const { baixo, esgotados } = estatisticas;
    let detalheBaixo = `itens com ≤ ${ESTOQUE_BAIXO} unidades`;
    if (baixo === 0) detalheBaixo = `nenhum item com ≤ ${ESTOQUE_BAIXO} un.`;
    else if (esgotados > 0) detalheBaixo = `≤ ${ESTOQUE_BAIXO} un. · ${esgotados} ${esgotados === 1 ? 'esgotado' : 'esgotados'}`;

    return (
        <motion.div
            className="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.3 } }}
        >
            <motion.header
                className="topbar"
                initial={{ y: -70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
                <div className="topbar-inner">
                    <Logo compacto />
                    <div className="topbar-right">
                        <div className="user-chip">
                            <span className="avatar">{inicial}</span>
                            <div className="user-meta">
                                <strong>{usuario?.username}</strong>
                                <small className={isAdmin ? 'role admin' : 'role'}>
                                    {isAdmin && <ShieldCheck size={11} />}
                                    {isAdmin ? 'Administrador' : 'Somente leitura'}
                                </small>
                            </div>
                        </div>
                        <Button variante="ghost" icon={LogOut} onClick={logout} className="btn-sm" aria-label="Sair">
                            <span className="hide-sm">Sair</span>
                        </Button>
                    </div>
                </div>
            </motion.header>

            <motion.main className="dashboard-content" variants={pagina} initial="hidden" animate="show">
                <motion.section className="page-head" variants={bloco}>
                    <div>
                        <span className="eyebrow">Controle de estoque</span>
                        <h1>Visão geral <span className="gradient-text">do inventário</span></h1>
                        <p className="page-sub">Acompanhe níveis, valores e movimente seus produtos.</p>
                    </div>
                    {isAdmin && (
                        <Button icon={Plus} onClick={abrirNovo}>Novo produto</Button>
                    )}
                </motion.section>

                <motion.section className="stats-grid" variants={pagina}>
                    <StatCard icon={Boxes} cor="violet" rotulo="Produtos" valor={estatisticas.total} formatar={formatarInteiro}
                        detalhe={`${categorias.length} ${categorias.length === 1 ? 'categoria' : 'categorias'}`} />
                    <StatCard icon={Layers} cor="cyan" rotulo="Unidades" valor={estatisticas.unidades} formatar={formatarInteiro}
                        detalhe="em todos os itens" />
                    <StatCard icon={Wallet} cor="emerald" rotulo="Valor em estoque" valor={estatisticas.valor} formatar={formatarValorEstoque}
                        titulo={formatarMoeda(estatisticas.valor)} detalhe="quantidade × preço" />
                    <StatCard icon={TriangleAlert} cor="rose" rotulo="Estoque baixo" valor={baixo} formatar={formatarInteiro}
                        detalhe={detalheBaixo}
                        alerta={baixo > 0}
                        onClick={baixo > 0 ? alternarSomenteBaixo : undefined}
                        ativo={somenteBaixo}
                        acao={baixo > 0 ? (somenteBaixo ? 'Limpar filtro' : 'Ver itens') : undefined} />
                </motion.section>

                <motion.section ref={painelRef} className="panel" variants={bloco}>
                    <div className="toolbar">
                        <div className="search">
                            <Search size={17} className="search-icon" aria-hidden="true" />
                            <input
                                ref={buscaRef}
                                type="search"
                                placeholder="Buscar por nome, categoria ou #ID"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                aria-label="Buscar produtos"
                                maxLength={100}
                            />
                            {busca
                                ? <button type="button" className="search-clear" onClick={() => setBusca('')} aria-label="Limpar busca"><X size={14} /></button>
                                : <kbd>/</kbd>}
                        </div>
                        <div className="sort-select">
                            <ArrowUpDown size={15} className="sort-icone" aria-hidden="true" />
                            <select aria-label="Ordenar por" value={`${ordem.campo}-${ordem.direcao}`} onChange={escolherOrdem}>
                                {ORDENACOES.map(({ valor, rotulo }) => <option key={valor} value={valor}>{rotulo}</option>)}
                            </select>
                            <ChevronDown size={15} className="sort-seta" aria-hidden="true" />
                        </div>
                        <Button
                            variante="ghost"
                            icon={RefreshCw}
                            className={`btn-sm btn-icon ${atualizando ? 'girando' : ''}`}
                            onClick={atualizarLista}
                            aria-label={atualizando ? 'Atualizando a lista' : 'Atualizar lista'}
                            aria-busy={atualizando || undefined}
                            title="Atualizar lista"
                        />
                    </div>

                    {categorias.length > 0 && (
                        <LayoutGroup id="chips">
                            {/* layoutScroll: no celular a fileira rola na horizontal e o destaque precisa medir isso */}
                            <motion.div layoutScroll className="chips" role="group" aria-label="Filtrar por categoria">
                                {['Todas', ...categorias].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        aria-pressed={categoriaAtiva === c}
                                        className={`chip ${categoriaAtiva === c ? 'active' : ''}`}
                                        onClick={() => setCategoriaAtiva(c)}
                                    >
                                        {categoriaAtiva === c && (
                                            <motion.span layoutId="chip-bg" className="chip-bg" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />
                                        )}
                                        <span className="chip-label">{c}</span>
                                    </button>
                                ))}
                            </motion.div>
                        </LayoutGroup>
                    )}

                    {somenteBaixo && (
                        <div className="filtro-ativo">
                            <TriangleAlert size={15} aria-hidden="true" />
                            <span>Mostrando só itens com até {ESTOQUE_BAIXO} unidades.</span>
                            <button type="button" onClick={() => setSomenteBaixo(false)}>Limpar</button>
                        </div>
                    )}

                    <div className={`table ${isAdmin ? 'with-actions' : ''}`} role="table" aria-label="Produtos">
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
                                            {rotulo} <Icone size={12} aria-hidden="true" />
                                        </button>
                                    </div>
                                );
                            })}
                            {isAdmin && <span className="th th-acoes" role="columnheader">Ações</span>}
                        </div>

                        <div className="table-body" role="rowgroup">
                            {carregando && Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="row skeleton" style={{ animationDelay: `${i * 0.08}s` }}>
                                    <span /><span /><span /><span /><span />{isAdmin && <span />}
                                </div>
                            ))}

                            <AnimatePresence mode="popLayout" initial={false}>
                                {!carregando && visiveis.map((p, i) => (
                                    <ProductRow
                                        key={p.id}
                                        produto={p}
                                        indice={i}
                                        isAdmin={isAdmin}
                                        onEditar={abrirEdicao}
                                        onExcluir={setProdutoExcluir}
                                    />
                                ))}
                            </AnimatePresence>

                            <AnimatePresence>
                                {!carregando && visiveis.length === 0 && (
                                    <motion.div
                                        className="empty-state"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <motion.span
                                            className="empty-icon"
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 2.4, ease: 'easeInOut' }}
                                        >
                                            <PackageOpen size={30} />
                                        </motion.span>
                                        <strong>{filtroAtivo ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</strong>
                                        <p>{filtroAtivo
                                            ? 'Tente outro termo ou limpe os filtros.'
                                            : isAdmin ? 'Comece adicionando o primeiro item do estoque.' : 'Ainda não há itens no estoque.'}
                                        </p>
                                        {filtroAtivo && (
                                            <Button variante="ghost" className="btn-sm" onClick={limparFiltros}>
                                                Limpar filtros
                                            </Button>
                                        )}
                                        {!filtroAtivo && isAdmin && (
                                            <Button icon={Plus} className="btn-sm" onClick={abrirNovo}>Novo produto</Button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {!carregando && produtos.length > 0 && (
                        <p className="table-footer">
                            Mostrando <strong>{visiveis.length}</strong> de <strong>{produtos.length}</strong> produtos
                            {atualizadoEm && <> · atualizado às {hora.format(atualizadoEm)}</>}
                        </p>
                    )}
                </motion.section>
            </motion.main>

            <ProductFormModal
                aberto={formAberto}
                produto={produtoEditado}
                onClose={fecharForm}
                onSaved={aoSalvar}
                categorias={categorias}
            />
            <ConfirmModal
                aberto={!!produtoExcluir}
                titulo="Excluir produto?"
                mensagem={`"${ultimoExcluir.current?.nome}" será removido permanentemente. Essa ação não pode ser desfeita.`}
                onConfirm={confirmarExclusao}
                onCancel={() => setProdutoExcluir(null)}
                carregando={excluindo}
            />
        </motion.div>
    );
};

export default ProductList;
