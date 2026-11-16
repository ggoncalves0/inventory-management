import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, PackageOpen, Plus, RefreshCw, Search, X
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
import '../styles/dashboard.css';


const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moedaCompacta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 2 });
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
// A partir de R$ 100 mil o valor completo não cabe no indicador: vira "R$ 1,26 mi" (o exato fica no title)
const formatarValorEstoque = (v) => (v >= 100000 ? moedaCompacta.format(v) : moeda.format(v));

// O gráfico mostra as 5 categorias de maior valor; o resto vira uma linha "Outras"
const MAX_LINHAS = 5;

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

    // Valor por categoria, em ordem decrescente (sobre todos os produtos, não só os filtrados).
    // Uma categoria sozinha não vira "Outras (1)": se sobrar só uma, ela aparece com o próprio nome.
    const linhasValor = useMemo(() => {
        const valores = new Map();
        produtos.forEach((p) => valores.set(p.categoria, (valores.get(p.categoria) || 0) + p.quantidade * p.preco));
        const ordenadas = [...valores].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
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

    const visiveis = useMemo(() => {
        const termo = normalizar(busca.trim().replace(/^#/, ''));
        const filtrados = produtos.filter((p) => {
            if (categoriaAtiva !== 'Todas' && p.categoria !== categoriaAtiva) return false;
            if (somenteBaixo && p.quantidade > ESTOQUE_BAIXO) return false;
            if (!termo) return true;
            const ehCodigo = /^\d+$/.test(termo) && Number(termo) === p.id;
            return ehCodigo || normalizar(p.nome).includes(termo) || normalizar(p.categoria).includes(termo);
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

    // Ligado pelo indicador "Estoque baixo". Se os resultados ficariam no pé da tela (celular), rola até a lista.
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

    // Clicar de novo na categoria ativa (no gráfico) volta para "Todas"
    const selecionarCategoria = useCallback((nome) => {
        setCategoriaAtiva((atual) => (atual === nome ? 'Todas' : nome));
    }, []);

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

    const { baixo, esgotados } = estatisticas;
    let detalheBaixo = `até ${ESTOQUE_BAIXO} unidades`;
    if (esgotados > 0) detalheBaixo = `${esgotados} ${esgotados === 1 ? 'esgotado' : 'esgotados'}`;

    return (
        // motion.div só para a transição de saída ao trocar de rota (sair)
        <motion.div className="dashboard" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
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

            {/* Faixa de comando: sempre escura (color-scheme: dark no CSS), nos dois temas */}
            <div className="faixa">
                <div className="faixa-inner">
                <section className="page-head">
                    <div>
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

                <h2 className="secao" id="secao-resumo"><span className="secao-num">01</span>Resumo</h2>
                <section className="stats-grid" aria-labelledby="secao-resumo">
                    <StatCard rotulo="Produtos" valor={inteiro.format(estatisticas.total)}
                        detalhe={`${categorias.length} ${categorias.length === 1 ? 'categoria' : 'categorias'}`} />
                    <StatCard rotulo="Unidades" valor={inteiro.format(estatisticas.unidades)} />
                    <StatCard rotulo="Valor em estoque" valor={formatarValorEstoque(estatisticas.valor)}
                        titulo={moeda.format(estatisticas.valor)} detalhe="quantidade × preço" />
                    <StatCard rotulo="Estoque baixo" valor={inteiro.format(baixo)}
                        detalhe={detalheBaixo}
                        alerta={baixo > 0}
                        onClick={baixo > 0 ? alternarSomenteBaixo : undefined}
                        ativo={somenteBaixo}
                        acao={baixo > 0 ? (somenteBaixo ? 'Limpar filtro' : 'Ver itens') : undefined} />
                </section>
                </div>
            </div>

            <main className="dashboard-content">
                <CategoryValueChart
                    linhas={linhasValor}
                    total={estatisticas.valor}
                    categoriaAtiva={categoriaAtiva}
                    onSelecionar={selecionarCategoria}
                />

                <section ref={painelRef} className="panel" aria-labelledby="secao-inventario">
                    {/* sem valor em estoque o gráfico (02) não aparece: o inventário assume o número dele */}
                    <h2 className="secao" id="secao-inventario">
                        <span className="secao-num">{estatisticas.valor > 0 ? '03' : '02'}</span>Inventário
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
                    </div>

                    {somenteBaixo && (
                        <div className="filtro-ativo">
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

                            {!carregando && visiveis.map((p) => (
                                <ProductRow
                                    key={p.id}
                                    produto={p}
                                    isAdmin={isAdmin}
                                    onEditar={abrirEdicao}
                                    onExcluir={setProdutoExcluir}
                                />
                            ))}

                            {!carregando && visiveis.length === 0 && (
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

                    {!carregando && produtos.length > 0 && (
                        <p className="table-footer">
                            {visiveis.length} de {produtos.length} produtos
                        </p>
                    )}
                </section>
            </main>

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
