import React, { useState } from 'react';
import axios from 'axios';

const DeleteProductButton = ({ id, onDelete }) => {
    const [errorMessage, setErrorMessage] = useState("");

    const excluirProduto = () => {
        axios.delete(`http://127.0.0.1:5000/produtos/${id}`)
            .then(() => {
                onDelete(id); // Remove o produto da lista
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
