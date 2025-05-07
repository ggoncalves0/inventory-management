import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteProductButton from './DeleteProductButton';
import EditProductForm from './EditProductForm';
import AddProductForm from './AddProductForm';
import instance from '../services/api';
import '../styles/products.css';

const ProductList = () => {
    const [produtos, setProdutos] = useState([]);
    const [editando, setEditando] = useState(null);
    const [adicionando, setAdicionando] = useState(false);
    const [buscaId, setBuscaId] = useState('');
    const [buscaNome, setBuscaNome] = useState('');
    const [buscaCategoria, setBuscaCategoria] = useState('');

    const usuarioId = localStorage.getItem('usuario_id');
    const navigate = useNavigate();

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

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario_id');
        navigate('/');
    };

    return (
        <div className="product-page">
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={logout} className="logout-button">Logout</button>
            </div>

            <h2>Lista de Produtos</h2>

            <div className="filters">
                <input
                    type="text"
                    placeholder='Buscar por ID'
                    value={buscaId}
                    onChange={(e) => setBuscaId(e.target.value)}
                />
                <input
                    type="text"
                    placeholder='Buscar por nome'
                    value={buscaNome}
                    onChange={(e) => setBuscaNome(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Buscar por categoria"
                    value={buscaCategoria}
                    onChange={(e) => setBuscaCategoria(e.target.value)}
                />
                <button onClick={buscarProdutos}>Buscar</button>
                {usuarioId === "2" && (
                    <button onClick={() => setAdicionando(!adicionando)}>
                        {adicionando ? 'Cancelar' : 'Adicionar Produto'}
                    </button>
                )}
            </div>

            {adicionando && (
                <div className="form-card">
                    <AddProductForm
                        onAddSuccess={() => {
                            setAdicionando(false);
                            buscarProdutos();
                        }}
                        onCancel={() => setAdicionando(false)}
                    />
                </div>
            )}

            <table className="product-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Quantidade</th>
                        <th>Preço</th>
                        {usuarioId === "2" && <th>Ações</th>}
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
                            {usuarioId === "2" && (
                                <td className="actions">
                                    <button onClick={() => setEditando(produto)}>Editar</button>
                                    <DeleteProductButton
                                    id={produto.id}
                                    onDelete={removerProdutoDaLista}
                                    confirmar={true}
                                    />
                                    </td>
                                )}
                                </tr>
                            ))}
                    </tbody>
            </table>

            {editando && (
                <div className="form-card">
                    <EditProductForm
                        product={editando}
                        onUpdateSuccess={() => {
                            setEditando(null);
                            buscarProdutos();
                        }}
                        onCancel={() => setEditando(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductList;
