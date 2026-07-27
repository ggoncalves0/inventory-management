import { useState } from 'react';
import instance from '../services/api'

function EditProductForm({ product, onUpdateSuccess, onCancel }) {
    const [nome, setNome] = useState(product.nome);
    const [categoria, setCategoria] = useState(product.categoria);
    const [quantidade, setQuantidade] = useState(product.quantidade);
    const [preco, setPreco] = useState(product.preco);
    const [erro, setErro] = useState('');

    const handleSubmit = async (e) => {
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

      try {
        await instance.put(`/produtos/${product.id}`, {
          nome,
          categoria,
          quantidade,
          preco
        });
        onUpdateSuccess('Produto atualizado com sucesso.');
      } catch (err) {
        setErro(err?.response?.data?.erro || 'Erro ao atualizar produto. Verifique se o nome já existe ou os campos estão corretos.');
      }
    };

    const bloquearCaracteresInvalidos = (e) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
      <form onSubmit={handleSubmit} noValidate>
        <h3>Editar Produto</h3>
        {erro && <p className="form-message erro">{erro}</p>}
        <label>Nome:</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
        <label>Categoria:</label>
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
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
        <button type="submit">Atualizar</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </form>
    );
}

export default EditProductForm;