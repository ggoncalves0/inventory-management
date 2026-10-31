import { useState } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { CircleAlert, DollarSign, Hash, Package, PackagePlus, Save, Tag } from 'lucide-react';
import instance, { mensagemDeErro } from '../services/api';
import Modal from './Modal';
import Field from './Field';
import Button from './Button';

const somenteDigitos = (v) => v.replace(/\D/g, '');
const somenteDecimal = (v) => v.replace(/[^\d.,]/g, '');

function ProductForm({ produto: produtoInicial, onClose, onSaved, categorias }) {
    // Guardado em estado para o título não mudar enquanto o modal anima a saída
    const [produto] = useState(produtoInicial);
    const editando = !!produto;

    const [nome, setNome] = useState(produto?.nome ?? '');
    const [categoria, setCategoria] = useState(produto?.categoria ?? '');
    const [quantidade, setQuantidade] = useState(produto ? String(produto.quantidade) : '');
    const [preco, setPreco] = useState(produto ? String(produto.preco).replace('.', ',') : '');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [escopo, animar] = useAnimate();

    const falhar = (mensagem) => {
        setErro(mensagem);
        animar(escopo.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        const precoNumero = Number(preco.replace(',', '.'));
        if (!nome.trim() || !categoria.trim()) return falhar('Preencha o nome e a categoria do produto.');
        if (quantidade === '') return falhar('Informe a quantidade (0 ou maior).');
        if (preco === '' || Number.isNaN(precoNumero) || precoNumero < 0) {
            return falhar('Preço precisa ser um número válido (0 ou maior).');
        }

        const dados = {
            nome: nome.trim(),
            categoria: categoria.trim(),
            quantidade: Number(quantidade),
            preco: precoNumero.toFixed(2),
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
            falhar(mensagemDeErro(err, 'Erro ao salvar produto.'));
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

            <Field label="Nome" icon={Package} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} autoFocus />
            <Field
                label="Categoria"
                icon={Tag}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                maxLength={50}
                list="categorias-existentes"
            />
            <datalist id="categorias-existentes">
                {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>

            <div className="field-row">
                <Field
                    label="Quantidade"
                    icon={Hash}
                    inputMode="numeric"
                    value={quantidade}
                    onChange={(e) => setQuantidade(somenteDigitos(e.target.value).slice(0, 10))}
                />
                <Field
                    label="Preço (R$)"
                    icon={DollarSign}
                    inputMode="decimal"
                    value={preco}
                    onChange={(e) => setPreco(somenteDecimal(e.target.value).slice(0, 12))}
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
