import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
    ArrowDown, ArrowUp, ArrowUpDown, Boxes, Layers, LogOut, PackageOpen,
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
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const formatarMoeda = (v) => moeda.format(v);
const formatarInteiro = (v) => inteiro.format(Math.round(v));

const normalizar = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const COLUNAS = [
    { campo: 'id', rotulo: 'ID' },
    { campo: 'nome', rotulo: 'Produto' },
    { campo: 'categoria', rotulo: 'Categoria' },
    { campo: 'quantidade', rotulo: 'Estoque' },
    { campo: 'preco', rotulo: 'Preço' },
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
    const [busca, setBusca] = useState('');
    const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
    const [ordem, setOrdem] = useState({ campo: 'id', direcao: 'asc' });
    const [formAberto, setFormAberto] = useState(false);
    const [produtoEditado, setProdutoEditado] = useState(null);
    const [produtoExcluir, setProdutoExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const buscaRef = useRef(null);
    // Mantém o nome no modal de exclusão enquanto ele anima a saída
    const ultimoExcluir = useRef(null);
    if (produtoExcluir) ultimoExcluir.current = produtoExcluir;

    const buscarProdutos = useCallback(async () => {
        try {
            const { data } = await instance.get('/produtos');
            setProdutos(data.map((p) => ({ ...p, preco: Number(p.preco) })));
        } catch (e) {
            if (e.response?.status !== 401) mostrarToast('erro', mensagemDeErro(e, 'Erro ao carregar produtos.'));
        } finally {
            setCarregando(false);
        }
    }, [mostrarToast]);

    useEffect(() => { buscarProdutos(); }, [buscarProdutos]);

    // Atalho "/" para focar a busca
    useEffect(() => {
        const aoTeclar = (e) => {
            const digitando = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
            if (e.key === '/' && !digitando) {
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
        maxQtd: Math.max(1, ...produtos.map((p) => p.quantidade)),
    }), [produtos]);

    const visiveis = useMemo(() => {
        const termo = normalizar(busca.trim().replace(/^#/, ''));
        const filtrados = produtos.filter((p) => {
            if (categoriaAtiva !== 'Todas' && p.categoria !== categoriaAtiva) return false;
            if (!termo) return true;
            return String(p.id) === termo || normalizar(p.nome).includes(termo) || normalizar(p.categoria).includes(termo);
        });
        const fator = ordem.direcao === 'asc' ? 1 : -1;
        return filtrados.sort((a, b) => {
            const [x, y] = [a[ordem.campo], b[ordem.campo]];
            return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * fator;
        });
    }, [produtos, busca, categoriaAtiva, ordem]);

    const alternarOrdem = (campo) => {
        setOrdem((o) => ({ campo, direcao: o.campo === campo && o.direcao === 'asc' ? 'desc' : 'asc' }));
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

    const filtroAtivo = busca || categoriaAtiva !== 'Todas';
    const inicial = (usuario?.username || '?').charAt(0).toUpperCase();

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
                        <Button icon={Plus} onClick={abrirNovo} className="btn-glow">Novo produto</Button>
                    )}
                </motion.section>

                <motion.section className="stats-grid" variants={pagina}>
                    <StatCard icon={Boxes} cor="violet" rotulo="Produtos" valor={estatisticas.total} formatar={formatarInteiro}
                        detalhe={`${categorias.length} ${categorias.length === 1 ? 'categoria' : 'categorias'}`} />
                    <StatCard icon={Layers} cor="cyan" rotulo="Unidades" valor={estatisticas.unidades} formatar={formatarInteiro}
                        detalhe="em todos os itens" />
                    <StatCard icon={Wallet} cor="emerald" rotulo="Valor em estoque" valor={estatisticas.valor} formatar={formatarMoeda}
                        detalhe="quantidade × preço" />
                    <StatCard icon={TriangleAlert} cor="rose" rotulo="Estoque baixo" valor={estatisticas.baixo} formatar={formatarInteiro}
                        detalhe={`itens com ≤ ${ESTOQUE_BAIXO} unidades`} />
                </motion.section>

                <motion.section className="panel" variants={bloco}>
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
                                ? <button className="search-clear" onClick={() => setBusca('')} aria-label="Limpar busca"><X size={14} /></button>
                                : <kbd>/</kbd>}
                        </div>
                        <Button variante="ghost" icon={RefreshCw} className="btn-sm btn-icon" onClick={buscarProdutos} aria-label="Atualizar lista" />
                    </div>

                    {categorias.length > 0 && (
                        <LayoutGroup id="chips">
                            <div className="chips" role="tablist" aria-label="Filtrar por categoria">
                                {['Todas', ...categorias].map((c) => (
                                    <button
                                        key={c}
                                        role="tab"
                                        aria-selected={categoriaAtiva === c}
                                        className={`chip ${categoriaAtiva === c ? 'active' : ''}`}
                                        onClick={() => setCategoriaAtiva(c)}
                                    >
                                        {categoriaAtiva === c && (
                                            <motion.span layoutId="chip-bg" className="chip-bg" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />
                                        )}
                                        <span className="chip-label">{c}</span>
                                    </button>
                                ))}
                            </div>
                        </LayoutGroup>
                    )}

                    <div className={`table ${isAdmin ? 'with-actions' : ''}`} role="table" aria-label="Produtos">
                        <div className="table-head" role="row">
                            {COLUNAS.map(({ campo, rotulo }) => {
                                const ativo = ordem.campo === campo;
                                const Icone = !ativo ? ArrowUpDown : ordem.direcao === 'asc' ? ArrowUp : ArrowDown;
                                return (
                                    <button
                                        key={campo}
                                        role="columnheader"
                                        aria-sort={ativo ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        className={`th th-${campo} ${ativo ? 'sorted' : ''}`}
                                        onClick={() => alternarOrdem(campo)}
                                    >
                                        {rotulo} <Icone size={12} />
                                    </button>
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
                                        maxQtd={estatisticas.maxQtd}
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
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            <PackageOpen size={30} />
                                        </motion.span>
                                        <strong>{filtroAtivo ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</strong>
                                        <p>{filtroAtivo
                                            ? 'Tente outro termo ou limpe os filtros.'
                                            : isAdmin ? 'Comece adicionando o primeiro item do estoque.' : 'Ainda não há itens no estoque.'}
                                        </p>
                                        {filtroAtivo && (
                                            <Button variante="ghost" className="btn-sm" onClick={() => { setBusca(''); setCategoriaAtiva('Todas'); }}>
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
