import { useState } from 'react';
import instance from '../services/api';

const DeleteProductButton = ({ id, onDelete }) => {
    const [errorMessage, setErrorMessage] = useState("");

    const excluirProduto = () => {
        const confirmar = window.confirm("Tem certeza que deseja excluir esse produto?");
        if (!confirmar) return;

        instance.delete(`/produtos/${id}`)
            .then(() => {
                onDelete(id);
            })
            .catch(error => {
                setErrorMessage("Erro: Produto não encontrado.");
            });
    };

    return (
        <div>
            <button onClick={excluirProduto}>Excluir</button>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default DeleteProductButton;
