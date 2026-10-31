import { motion } from 'motion/react';
import { LoaderCircle } from 'lucide-react';

const Button = ({ variante = 'primary', icon: Icon, carregando = false, children, className = '', disabled, ...props }) => (
    <motion.button
        className={`btn btn-${variante} ${className}`}
        whileHover={disabled || carregando ? undefined : { y: -1 }}
        whileTap={disabled || carregando ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        disabled={disabled || carregando}
        aria-busy={carregando || undefined}
        {...props}
    >
        {carregando
            ? <LoaderCircle className="spin" size={17} aria-hidden="true" />
            : Icon && <Icon size={17} aria-hidden="true" />}
        {children && <span>{children}</span>}
    </motion.button>
);

export default Button;
