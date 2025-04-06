import { useState, useEffect} from 'react';
import instance from '../services/api'

function EditProductForm({ product, onUpdateSuccess, onCancel }) {
    const [nome, setNome] = useState(product.nome);
    const [categoria, setCategoria] = useState(product.categoria);
    const [quantidade, setQuantidade] = useState(product.quantidade);
    const [preco, setPreco] = useState(product.preco);
    const [erro, setErro] = useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await instance.put(`/produtos/${product.id}`, {
          nome,
          categoria,
          quantidade,
          preco
        });
        onUpdateSuccess();
      } catch (err) {
        setErro(err?.response?.data?.erro || 'Erro ao atualizar produto. Verifique se o nome já existe ou os campos estão corretos.');
      }
    };
  
    return (
      <form onSubmit={handleSubmit}>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}
        <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          required
        />
        <button type="submit">Atualizar</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </form>
    );
  }
  
  export default EditProductForm;