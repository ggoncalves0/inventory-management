import { useEffect, useState } from 'react';
import DeleteProductButton from './DeleteProductButton'; 
import EditProductForm from './EditProductForm';
import instance from '../services/api'

const ProductList = () => {
    const [produtos, setProdutos] = useState([]);
    const [editando, setEditando] = useState(null);
    const [buscaId, setBuscaId] = useState('');
    const [buscaNome, setBuscaNome] = useState('');
    const [buscaCategoria, setBuscaCategoria] = useState('');

    useEffect(() => {
        buscarProdutos();
    }, []);

    async function buscarProdutos() {
        try {
            const params = {};
            if (buscaId) params.id = buscaId;
            if (buscaNome) params.nome = buscaNome;
            if (buscaCategoria) params.categoria = buscaCategoria;
    
            const response = await instance.get('/produtos', { params });
            setProdutos(response.data);
        } catch (e) {
            alert(`Erro ao buscar produtos: ${e.response?.data?.message || e.message}`);
        }
    }

    const removerProdutoDaLista = (id) => {
        setProdutos(produtos.filter(produto => produto.id !== id));
    };

    return (
        <div>
            <h2>Lista de Produtos</h2>
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder='Buscar por ID'
                    value={buscaId}
                    onChange={(e) => setBuscaId(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <input
                    type="text"
                    placeholder='Buscar Por nome'
                    value={buscaNome}
                    onChange={(e) => setBuscaNome(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <input
                    type="text"
                    placeholder="Buscar por Categoria"
                    value={buscaCategoria}
                    onChange={(e) => setBuscaCategoria(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <button onClick={buscarProdutos}>Buscar</button>
            </div>
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
                                <button onClick={() => setEditando(produto)}>Editar</button>
                                <DeleteProductButton id={produto.id} onDelete={removerProdutoDaLista} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {editando && (
                <EditProductForm
                    product={editando}
                    onUpdateSuccess={() => {
                        setEditando(null);
                        buscarProdutos();
                    }}
                    onCancel={() => setEditando(null)}
                />
            )}
        </div>
    );
};

export default ProductList;
