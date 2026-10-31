import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Input com label flutuante, ícone opcional e botão de mostrar/ocultar senha.
const Field = ({ label, icon: Icon, type = 'text', invalido = false, className = '', ...props }) => {
    const id = useId();
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const ehSenha = type === 'password';

    return (
        <div className={`field ${Icon ? 'has-icon' : ''} ${ehSenha ? 'has-toggle' : ''} ${invalido ? 'invalid' : ''} ${className}`}>
            {Icon && <Icon className="field-icon" size={18} aria-hidden="true" />}
            <input
                id={id}
                type={ehSenha && mostrarSenha ? 'text' : type}
                placeholder=" "
                aria-invalid={invalido || undefined}
                {...props}
            />
            <label htmlFor={id}>{label}</label>
            {ehSenha && (
                <button
                    type="button"
                    className="field-toggle"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                >
                    {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            )}
        </div>
    );
};

export default Field;
