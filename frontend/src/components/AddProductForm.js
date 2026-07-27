import { useState } from 'react';
import instance from '../services/api'

const AddProductForm = ({ onAddSuccess, onCancel }) => {
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [preco, setPreco] = useState('');
    const [erro, setErro] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');

        if (!nome.trim() || !categoria.trim()) {
            setErro('Preencha o nome e a categoria do produto.');
            return;
        }
        if (quantidade === '' || isNaN(Number(quantidade)) || Number(quantidade) < 0) {
            setErro('Quantidade precisa ser um número válido (0 ou maior).');
            return;
        }
        if (preco === '' || isNaN(Number(preco)) || Number(preco) < 0) {
            setErro('Preço precisa ser um número válido (0 ou maior).');
            return;
        }

        const novoProduto = { nome, categoria, quantidade, preco };

        try {
            await instance.post(`/produtos`, novoProduto);
            onAddSuccess(`Produto "${novoProduto.nome}" cadastrado com sucesso.`);
        } catch (error) {
            setErro(error.response?.data?.erro || 'Erro ao cadastrar produto.');
        }
    };

    // Bloqueia caracteres que o input[type=number] aceita mas não fazem sentido aqui (e, +, -)
    const bloquearCaracteresInvalidos = (e) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div>
            <h2>Cadastrar Produto</h2>
            {erro && <p className="form-message erro">{erro}</p>}
            <form onSubmit={handleSubmit} noValidate>
                <label>Nome:</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
                <label>Categoria:</label>
                <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
                <label>Quantidade:</label>
                <input
                    type="number"
                    min="0"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    onKeyDown={bloquearCaracteresInvalidos}
                />
                <label>Preço:</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    onKeyDown={bloquearCaracteresInvalidos}
                />
                <button type="submit">Cadastrar</button>
                <button type="button" onClick={onCancel}>Cancelar</button>
            </form>
        </div>
    );
};

export default AddProductForm;