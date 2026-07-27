import { useState } from 'react';
import instance from '../services/api';
import ConfirmModal from './ConfirmModal';

const DeleteProductButton = ({ id, onDelete, onFeedback }) => {
    const [mostrarModal, setMostrarModal] = useState(false);

    const excluirProduto = () => {
        instance.delete(`/produtos/${id}`)
            .then(() => {
                onDelete(id);
                onFeedback && onFeedback('sucesso', 'Produto excluído com sucesso.');
            })
            .catch(() => {
                onFeedback && onFeedback('erro', 'Erro ao excluir produto. Tente novamente.');
            })
            .finally(() => setMostrarModal(false));
    };

    return (
        <>
            <button onClick={() => setMostrarModal(true)}>Excluir</button>
            {mostrarModal && (
                <ConfirmModal
                    mensagem="Tem certeza que deseja excluir esse produto? Essa ação não pode ser desfeita."
                    onConfirm={excluirProduto}
                    onCancel={() => setMostrarModal(false)}
                />
            )}
        </>
    );
};

export default DeleteProductButton;