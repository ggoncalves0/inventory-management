import { motion } from 'motion/react';
import { Trash2, TriangleAlert } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmModal = ({ aberto, titulo, mensagem, onConfirm, onCancel, carregando }) => (
    <Modal aberto={aberto} onClose={carregando ? () => {} : onCancel} titulo={titulo} largura={420}>
        <div className="confirm">
            <motion.span
                className="confirm-icon"
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.05 }}
            >
                <TriangleAlert size={24} />
            </motion.span>
            <h3>{titulo}</h3>
            <p>{mensagem}</p>
        </div>
        <div className="modal-actions">
            <Button variante="ghost" onClick={onCancel} disabled={carregando}>Cancelar</Button>
            <Button variante="danger" icon={Trash2} onClick={onConfirm} carregando={carregando}>Excluir</Button>
        </div>
    </Modal>
);

export default ConfirmModal;
