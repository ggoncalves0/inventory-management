import { useState } from 'react';
import instance from '../services/api'

const AddProductForm = ({ onAddSuccess, onCancel }) => {
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [preco, setPreco] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const novoProduto = { nome, categoria, quantidade, preco };

        try {
            await instance.post(`/produtos`, novoProduto);
            alert(`Produto ${novoProduto.nome} cadastrado com sucesso`);
            onAddSuccess();
        } catch (error) {
            alert(`Erro ao cadastrar produto ${novoProduto.nome}: ${error.response?.data?.erro || error.message}`);
        }
    };

    return (
        <div>
            <h2>Cadastrar Produto</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nome:</label>
                    <br />
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div>
                    <label>Categoria:</label>
                    <br />
                    <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
                </div>
                <div>
                    <label>Quantidade:</label>
                    <br />
                    <input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required />
                </div>
                <div>
                    <label>Preço:</label>
                    <br />
                    <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} required />
                </div>
                <br />
                <button type="submit">Cadastrar</button>
                <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>Cancelar</button>
            </form>
        </div>
    );
};

export default AddProductForm;
