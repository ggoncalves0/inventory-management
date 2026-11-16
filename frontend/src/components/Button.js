import { LoaderCircle } from 'lucide-react';

const Button = ({ variante = 'primary', icon: Icon, carregando = false, children, className = '', disabled, type = 'button', ...props }) => (
    <button
        type={type}
        className={`btn btn-${variante} ${className}`}
        disabled={disabled || carregando}
        aria-busy={carregando || undefined}
        {...props}
    >
        {carregando
            ? <LoaderCircle className="spin" size={16} aria-hidden="true" />
            : Icon && <Icon size={16} aria-hidden="true" />}
        {children && <span>{children}</span>}
    </button>
);

export default Button;
