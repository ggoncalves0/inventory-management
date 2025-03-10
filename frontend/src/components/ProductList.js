import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DeleteProductButton from './DeleteProductButton'; // Importa o botão

const ProductList = () => {
    const [produtos, setProdutos] = useState([]);

    useEffect(() => {
        buscarProdutos();
    }, []);

    const buscarProdutos = () => {
        axios.get('http://127.0.0.1:5000/produtos')
            .then(response => {
                setProdutos(response.data);
            })
            .catch(error => {
                console.error("Erro ao buscar produtos:", error);
            });
    };

    const removerProdutoDaLista = (id) => {
        setProdutos(produtos.filter(produto => produto.id !== id));
    };

    return (
        <div>
            <h2>Lista de Produtos</h2>
            <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Quantidade</th>
                        <th>Preço</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {produtos.map((produto) => (
                        <tr key={produto.id}>
                            <td>{produto.id}</td>
                            <td>{produto.nome}</td>
                            <td>{produto.categoria}</td>
                            <td>{produto.quantidade}</td>
                            <td>R$ {produto.preco}</td>
                            <td>
                                <DeleteProductButton id={produto.id} onDelete={removerProdutoDaLista} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductList;
