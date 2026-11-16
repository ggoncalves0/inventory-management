import { useId, useState } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';

// Campo com rótulo acima, botão de mostrar/ocultar senha, mensagem de erro própria e uma dica
// neutra opcional (as duas ligadas ao input por aria-describedby). Com erro, a dica não aparece.
const Field = ({ label, type = 'text', invalido = false, erro, dica, className = '', 'aria-describedby': descricao, ...props }) => {
    const id = useId();
    const idErro = `${id}-erro`;
    const idDica = `${id}-dica`;
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const ehSenha = type === 'password';
    const marcado = invalido || !!erro;
    const mostrarDica = !!dica && !erro;
    const descritores = [descricao, erro && idErro, mostrarDica && idDica].filter(Boolean).join(' ') || undefined;

    return (
        <div className={`field ${ehSenha ? 'has-toggle' : ''} ${marcado ? 'invalid' : ''} ${className}`}>
            <label htmlFor={id}>{label}</label>
            <div className="field-control">
                <input
                    id={id}
                    type={ehSenha && mostrarSenha ? 'text' : type}
                    aria-invalid={marcado || undefined}
                    aria-describedby={descritores}
                    {...props}
                />
                {ehSenha && (
                    <button
                        type="button"
                        className="field-toggle"
                        onClick={() => setMostrarSenha((v) => !v)}
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                        {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {erro && (
                <p id={idErro} className="field-erro">
                    <CircleAlert size={14} aria-hidden="true" /> {erro}
                </p>
            )}
            {mostrarDica && (
                <p id={idDica} className="field-dica" role="status">{dica}</p>
            )}
        </div>
    );
};

export default Field;
