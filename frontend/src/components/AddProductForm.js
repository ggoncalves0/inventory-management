import { useState } from 'react';
import instance from '../services/api'

const AddProductForm = () => {
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [preco, setPreco] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const novoProduto = { nome, categoria, quantidade, preco };

        //axios.post('http://localhost:5000/produtos', novoProduto)
        //   .then(response => {
        //       alert("Produto cadastrado com sucesso!");
        //    })
        //   .catch(error => {
        //        alert("Erro ao cadastrar o produto.");
        //    });\
        try {
            await instance.post(`/produtos`, novoProduto);
            alert(`Produto ${novoProduto.nome} cadastrado com sucesso`)
        } catch (error) {
            alert(`Erro ao cadastrar produto ${novoProduto.nome}: ${error.response.data ? error.response.data : error}`)
        }
    };

    return (
        <div>
            <h2>Cadastrar Produto</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nome:</label>
                    <br></br>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div>
                    <label>Categoria:</label>
                    <br></br>
                    <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
                </div>
                <div>
                    <label>Quantidade:</label>
                    <br></br>
                    <input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required />
                </div>
                <div>
                    <label>Preço:</label>
                    <br></br>
                    <input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} required />
                </div>
                <br></br>
                <button type="submit">Cadastrar</button>
            </form>
        </div>
    );
};

export default AddProductForm;
