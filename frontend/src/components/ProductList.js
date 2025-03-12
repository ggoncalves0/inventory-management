import { useEffect, useState } from 'react';
import DeleteProductButton from './DeleteProductButton'; // Importa o botão
import instance from '../services/api'

const ProductList = () => {
    const [produtos, setProdutos] = useState([]);

    useEffect(() => {
        buscarProdutos();
    }, []);

    async function buscarProdutos() {
        try {
            const response = await instance.get(`/produtos`)
            setProdutos(response.data)
        } catch (e) {
            alert(`Erro ao listar produtos: ${e.data.message ? e.data.message : e}`)
        }
        //instance.get('/produtos')
        //    .then(response => {
        //        console.log(response)
        //        setProdutos(response.data);
        //   })
        //    .catch(error => {
        //        alert("Erro ao buscar produtos:", error);
        //    });
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
