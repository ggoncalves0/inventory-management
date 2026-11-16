import { useEffect, useRef, useState } from 'react';
import { CircleAlert, History } from 'lucide-react';
import instance, { mensagemDeErro } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import Field from './Field';
import Button from './Button';
import { formatarCodigo } from '../utils/formatos';
import { categoriaExistente } from '../utils/categorias';
import { limparRascunho, salvarRascunho } from '../utils/rascunho';

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

const valoresDe = (produto) => ({
    nome: produto?.nome ?? '',
    categoria: produto?.categoria ?? '',
    quantidade: produto ? String(produto.quantidade) : '',
    preco: produto ? formatoPreco.format(produto.preco) : '',
});

// `rascunho`: valores recuperados depois que a sessão expirou com este formulário aberto
function ProductForm({ produto: produtoInicial, onClose, onSaved, categorias, rascunho }) {
    const { usuario } = useAuth();
    // Guardado em estado para o título não mudar enquanto o modal anima a saída
    const [produto] = useState(produtoInicial);
    const editando = !!produto;

    // Valores de quando o formulário abriu: comparados aos atuais para saber se há algo a guardar
    const [originais] = useState(() => valoresDe(produto));
    const [recuperado] = useState(() => !!rascunho);
    const [valores, setValores] = useState(() => (rascunho ? { ...originais, ...rascunho } : originais));
    const [erros, setErros] = useState({});
    const [erro, setErro] = useState('');
    const [dicaCategoria, setDicaCategoria] = useState('');
    const [salvando, setSalvando] = useState(false);
    const escopo = useRef(null);

    // Enquanto o formulário está aberto, o que foi digitado fica guardado nesta aba: se a sessão expirar,
    // ele reabre depois do novo login. Fechar ou salvar descarta (ver ProductList).
    useEffect(() => {
        // Sessão acabou de cair (usuario vira null antes da tela sair): mantém o rascunho como estava,
        // senão ele seria regravado sem dono e descartado depois do novo login.
        if (!usuario) return;
        const alterado = CAMPOS.some((c) => valores[c] !== originais[c]);
        if (alterado) salvarRascunho({ usuario: usuario?.username, produtoId: produto?.id ?? null, valores });
        else limparRascunho();
    }, [valores, originais, produto, usuario]);

    const alterar = (campo, valor) => {
        setValores((atual) => ({ ...atual, [campo]: valor }));
        setErros((atual) => (atual[campo] ? { ...atual, [campo]: undefined } : atual));
    };

    // "periféricos", "Perifericos" -> "Periféricos": usa a categoria já cadastrada em vez de criar uma variação
    const ajustarCategoria = () => {
        const existente = categoriaExistente(valores.categoria, categorias);
        if (!existente || existente === valores.categoria) return;
        setValores((atual) => ({ ...atual, categoria: existente }));
        if (existente !== valores.categoria.trim()) setDicaCategoria(`Usando a categoria já cadastrada "${existente}".`);
    };

    const focar = (campo) => escopo.current?.querySelector(`[name="${campo}"]`)?.focus();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        const { erros: novos, valor } = validar(valores);
        const primeiro = CAMPOS.find((c) => novos[c]);
        if (primeiro) {
            setErros(novos);
            focar(primeiro);
            return;
        }

        const dados = {
            nome: valores.nome.trim(),
            // também ao salvar com Enter, sem ter saído do campo
            categoria: categoriaExistente(valores.categoria, categorias) ?? valores.categoria.trim(),
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
            // Sessão expirada: a tela já vai para o login, e o rascunho fica guardado para reabrir depois
            if (err.response?.status === 401) return;
            const mensagem = mensagemDeErro(err, 'Erro ao salvar produto.');
            // 409 = já existe um produto com esse nome: o erro é do campo Nome
            if (err.response?.status === 409) {
                setErros({ nome: mensagem });
                focar('nome');
            } else {
                setErro(mensagem);
            }
            setSalvando(false);
        }
    };

    return (
        <form ref={escopo} onSubmit={handleSubmit} noValidate className="product-form">
            <div className="modal-header">
                <h2>{editando ? 'Editar produto' : 'Novo produto'}</h2>
                {editando && <p>Item {formatarCodigo(produto.id)}</p>}
            </div>

            {recuperado && (
                <p className="form-message info" role="status">
                    <History size={16} aria-hidden="true" />
                    Recuperamos o que você estava preenchendo quando a sessão expirou. Confira e salve.
                </p>
            )}

            <Field
                label="Nome"
                name="nome"
                value={valores.nome}
                onChange={(e) => alterar('nome', e.target.value)}
                maxLength={100}
                erro={erros.nome}
                autoFocus
            />
            <Field
                label="Categoria"
                name="categoria"
                value={valores.categoria}
                onChange={(e) => { alterar('categoria', e.target.value); setDicaCategoria(''); }}
                onBlur={ajustarCategoria}
                maxLength={50}
                list="categorias-existentes"
                erro={erros.categoria}
                dica={dicaCategoria}
            />
            <datalist id="categorias-existentes">
                {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>

            <div className="field-row">
                <Field
                    label="Quantidade"
                    name="quantidade"
                    inputMode="numeric"
                    value={valores.quantidade}
                    onChange={(e) => alterar('quantidade', somenteDigitos(e.target.value).slice(0, 10))}
                    erro={erros.quantidade}
                />
                <Field
                    label="Preço (R$)"
                    placeholder="0,00"
                    name="preco"
                    inputMode="decimal"
                    value={valores.preco}
                    onChange={(e) => alterar('preco', somenteDecimal(e.target.value).slice(0, 13))}
                    erro={erros.preco}
                />
            </div>

            {erro && (
                <p className="form-message erro" role="alert">
                    <CircleAlert size={16} aria-hidden="true" /> {erro}
                </p>
            )}

            <div className="modal-actions">
                <Button type="button" variante="ghost" onClick={onClose} disabled={salvando}>Cancelar</Button>
                <Button type="submit" carregando={salvando}>
                    {editando ? 'Salvar alterações' : 'Cadastrar produto'}
                </Button>
            </div>
        </form>
    );
}

const ProductFormModal = ({ aberto, produto, onClose, onSaved, categorias = [], rascunho = null, focoAoFechar }) => (
    <Modal aberto={aberto} onClose={onClose} titulo={produto ? 'Editar produto' : 'Novo produto'} largura={520} focoAoFechar={focoAoFechar}>
        <ProductForm produto={produto} onClose={onClose} onSaved={onSaved} categorias={categorias} rascunho={rascunho} />
    </Modal>
);

export default ProductFormModal;
