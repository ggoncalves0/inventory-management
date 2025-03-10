import React, { useState } from 'react';
import axios from 'axios';

const AddProductForm = () => {
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [preco, setPreco] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const novoProduto = { nome, categoria, quantidade, preco };

        axios.post('http://127.0.0.1:5000/produtos', novoProduto)
            .then(response => {
                alert("Produto cadastrado com sucesso!");
            })
            .catch(error => {
                alert("Erro ao cadastrar o produto.");
            });
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
