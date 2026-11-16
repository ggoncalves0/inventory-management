import { useId, useState } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';

// Input com label flutuante, ícone opcional, botão de mostrar/ocultar senha
// e mensagem de erro própria (ligada ao input por aria-describedby).
const Field = ({ label, icon: Icon, type = 'text', invalido = false, erro, className = '', 'aria-describedby': descricao, ...props }) => {
    const id = useId();
    const idErro = `${id}-erro`;
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const ehSenha = type === 'password';
    const marcado = invalido || !!erro;
    const descritores = [descricao, erro && idErro].filter(Boolean).join(' ') || undefined;

    return (
        <div className={`field ${Icon ? 'has-icon' : ''} ${ehSenha ? 'has-toggle' : ''} ${marcado ? 'invalid' : ''} ${className}`}>
            <div className="field-control">
                {Icon && <Icon className="field-icon" size={18} aria-hidden="true" />}
                <input
                    id={id}
                    type={ehSenha && mostrarSenha ? 'text' : type}
                    placeholder=" "
                    aria-invalid={marcado || undefined}
                    aria-describedby={descritores}
                    {...props}
                />
                <label htmlFor={id}>{label}</label>
                {ehSenha && (
                    <button
                        type="button"
                        className="field-toggle"
                        onClick={() => setMostrarSenha((v) => !v)}
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                        {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                )}
            </div>
            {erro && (
                <p id={idErro} className="field-erro">
                    <CircleAlert size={14} aria-hidden="true" /> {erro}
                </p>
            )}
        </div>
    );
};

export default Field;
