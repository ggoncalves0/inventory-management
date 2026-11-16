import Modal from './Modal';
import Button from './Button';

// O foco abre em "Cancelar": numa confirmação destrutiva, Enter por engano não pode excluir.
const ConfirmModal = ({ aberto, titulo, mensagem, onConfirm, onCancel, carregando, focoAoFechar }) => (
    <Modal aberto={aberto} onClose={carregando ? () => {} : onCancel} titulo={titulo} largura={420} focoAoFechar={focoAoFechar}>
        <div className="confirm">
            <div className="modal-header">
                <h2>{titulo}</h2>
            </div>
            <p>{mensagem}</p>
        </div>
        <div className="modal-actions">
            <Button variante="ghost" onClick={onCancel} disabled={carregando} data-foco-inicial>Cancelar</Button>
            <Button variante="danger" onClick={onConfirm} carregando={carregando}>Excluir</Button>
        </div>
    </Modal>
);

export default ConfirmModal;
