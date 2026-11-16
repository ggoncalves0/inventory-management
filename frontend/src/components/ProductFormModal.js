import { useState } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { Banknote, CircleAlert, Layers, Package, PackagePlus, Save, Tag } from 'lucide-react';
import instance, { mensagemDeErro } from '../services/api';
import Modal from './Modal';
import Field from './Field';
import Button from './Button';

// Mesmos limites do backend (validators.py)
const QUANTIDADE_MAX = 2147483647;
const PRECO_MAX = 99999999.99;

const CAMPOS = ['nome', 'categoria', 'quantidade', 'preco'];
const MILHAR = /^\d{1,3}(\.\d{3})+$/;

const somenteDigitos = (v) => v.replace(/\D/g, '');
const somenteDecimal = (v) => v.replace(/[^\d.,]/g, '');
const formatoPreco = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Lê preço no formato brasileiro (1.299,90) e também com ponto decimal (1299.90).
// Ponto seguido de 3 dígitos é separador de milhar ("1.299" = 1299); formatos ambíguos dão NaN.
function lerPreco(texto) {
    const t = texto.trim();
    let inteiro = t;
    let decimais = '';
    if (t.includes(',')) {
        const partes = t.split(',');
        if (partes.length > 2) return NaN;
        [inteiro, decimais] = partes;
    } else if (/^\d+\.\d{1,2}$/.test(t)) {
        [inteiro, decimais] = t.split('.');
    }
    if (inteiro.includes('.')) {
        if (!MILHAR.test(inteiro)) return NaN;
        inteiro = inteiro.replace(/\./g, '');
    }
    if (!/^\d*$/.test(inteiro) || !/^\d{0,2}$/.test(decimais) || (!inteiro && !decimais)) return NaN;
    return Number(`${inteiro || '0'}.${decimais || '0'}`);
}

function validar({ nome, categoria, quantidade, preco }) {
    const erros = {};
    if (!nome.trim()) erros.nome = 'Informe o nome do produto.';
    if (!categoria.trim()) erros.categoria = 'Informe a categoria.';
    if (quantidade === '') erros.quantidade = 'Informe a quantidade (pode ser 0).';
    else if (Number(quantidade) > QUANTIDADE_MAX) erros.quantidade = 'Quantidade acima do permitido.';

    const valor = lerPreco(preco);
    if (!preco.trim()) erros.preco = 'Informe o preço.';
    else if (Number.isNaN(valor)) erros.preco = 'Use o formato 1.299,90.';
    else if (valor > PRECO_MAX) erros.preco = 'Preço acima do permitido.';
    return { erros, valor };
}

function ProductForm({ produto: produtoInicial, onClose, onSaved, categorias }) {
    // Guardado em estado para o título não mudar enquanto o modal anima a saída
    const [produto] = useState(produtoInicial);
    const editando = !!produto;

    const [valores, setValores] = useState(() => ({
        nome: produto?.nome ?? '',
        categoria: produto?.categoria ?? '',
        quantidade: produto ? String(produto.quantidade) : '',
        preco: produto ? formatoPreco.format(produto.preco) : '',
    }));
    const [erros, setErros] = useState({});
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [escopo, animar] = useAnimate();

    const alterar = (campo, valor) => {
        setValores((atual) => ({ ...atual, [campo]: valor }));
        setErros((atual) => (atual[campo] ? { ...atual, [campo]: undefined } : atual));
    };

    const tremer = () => animar(escopo.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 });
    const focar = (campo) => escopo.current?.querySelector(`[name="${campo}"]`)?.focus();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        const { erros: novos, valor } = validar(valores);
        const primeiro = CAMPOS.find((c) => novos[c]);
        if (primeiro) {
            setErros(novos);
            focar(primeiro);
            tremer();
            return;
        }

        const dados = {
            nome: valores.nome.trim(),
            categoria: valores.categoria.trim(),
            quantidade: Number(valores.quantidade),
            preco: valor.toFixed(2),
        };

        setSalvando(true);
        try {
            if (editando) {
                await instance.put(`/produtos/${produto.id}`, dados);
                onSaved(`"${dados.nome}" atualizado com sucesso.`);
            } else {
                await instance.post('/produtos', dados);
                onSaved(`"${dados.nome}" cadastrado com sucesso.`);
            }
        } catch (err) {
            const mensagem = mensagemDeErro(err, 'Erro ao salvar produto.');
            // 409 = já existe um produto com esse nome: o erro é do campo Nome
            if (err.response?.status === 409) {
                setErros({ nome: mensagem });
                focar('nome');
            } else {
                setErro(mensagem);
            }
            tremer();
            setSalvando(false);
        }
    };

    return (
        <form ref={escopo} onSubmit={handleSubmit} noValidate className="product-form">
            <div className="modal-header">
                <span className="modal-header-icon">
                    {editando ? <Package size={20} /> : <PackagePlus size={20} />}
                </span>
                <div>
                    <h3>{editando ? 'Editar produto' : 'Novo produto'}</h3>
                    <p>{editando ? `Alterando o item #${produto.id}` : 'Preencha os dados do item.'}</p>
                </div>
            </div>

            <Field
                label="Nome"
                name="nome"
                icon={Package}
                value={valores.nome}
                onChange={(e) => alterar('nome', e.target.value)}
                maxLength={100}
                erro={erros.nome}
                autoFocus
            />
            <Field
                label="Categoria"
                name="categoria"
                icon={Tag}
                value={valores.categoria}
                onChange={(e) => alterar('categoria', e.target.value)}
                maxLength={50}
                list="categorias-existentes"
                erro={erros.categoria}
            />
            <datalist id="categorias-existentes">
                {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>

            <div className="field-row">
                <Field
                    label="Quantidade"
                    name="quantidade"
                    icon={Layers}
                    inputMode="numeric"
                    value={valores.quantidade}
                    onChange={(e) => alterar('quantidade', somenteDigitos(e.target.value).slice(0, 10))}
                    erro={erros.quantidade}
                />
                <Field
                    label="Preço (R$)"
                    name="preco"
                    icon={Banknote}
                    inputMode="decimal"
                    value={valores.preco}
                    onChange={(e) => alterar('preco', somenteDecimal(e.target.value).slice(0, 13))}
                    erro={erros.preco}
                />
            </div>

            <AnimatePresence>
                {erro && (
                    <motion.p
                        className="form-message erro"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <CircleAlert size={16} /> {erro}
                    </motion.p>
                )}
            </AnimatePresence>

            <div className="modal-actions">
                <Button type="button" variante="ghost" onClick={onClose} disabled={salvando}>Cancelar</Button>
                <Button type="submit" icon={editando ? Save : PackagePlus} carregando={salvando}>
                    {editando ? 'Salvar alterações' : 'Cadastrar'}
                </Button>
            </div>
        </form>
    );
}

const ProductFormModal = ({ aberto, produto, onClose, onSaved, categorias = [] }) => (
    <Modal aberto={aberto} onClose={onClose} titulo={produto ? 'Editar produto' : 'Novo produto'} largura={520}>
        <ProductForm produto={produto} onClose={onClose} onSaved={onSaved} categorias={categorias} />
    </Modal>
);

export default ProductFormModal;
