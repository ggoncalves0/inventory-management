import Modal from './Modal';
import Button from './Button';

const ConfirmModal = ({ aberto, titulo, mensagem, onConfirm, onCancel, carregando }) => (
    <Modal aberto={aberto} onClose={carregando ? () => {} : onCancel} titulo={titulo} largura={420}>
        <div className="confirm">
            <div className="modal-header">
                <h2>{titulo}</h2>
            </div>
            <p>{mensagem}</p>
        </div>
        <div className="modal-actions">
            <Button variante="ghost" onClick={onCancel} disabled={carregando}>Cancelar</Button>
            <Button variante="danger" onClick={onConfirm} carregando={carregando}>Excluir</Button>
        </div>
    </Modal>
);

export default ConfirmModal;
