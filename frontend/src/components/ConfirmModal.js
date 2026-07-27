const ConfirmModal = ({ mensagem, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <p>{mensagem}</p>
                <div className="modal-actions">
                    <button className="modal-cancel" onClick={onCancel}>Cancelar</button>
                    <button className="modal-confirm" onClick={onConfirm}>Excluir</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;