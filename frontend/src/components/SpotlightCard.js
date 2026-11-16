import { forwardRef, useRef } from 'react';
import { motion } from 'motion/react';

// Cartão com um brilho que segue o cursor (via variáveis CSS --mx / --my).
// Atualiza no máximo uma vez por frame para não sobrecarregar o navegador.
// `as="button"` quando o cartão é clicável.
const SpotlightCard = forwardRef(({ as = 'div', className = '', children, onMouseMove, ...props }, ref) => {
    const frame = useRef(0);
    const Componente = as === 'button' ? motion.button : motion.div;

    const moverBrilho = (e) => {
        const alvo = e.currentTarget;
        const { clientX, clientY } = e;
        if (!frame.current) {
            frame.current = requestAnimationFrame(() => {
                frame.current = 0;
                const rect = alvo.getBoundingClientRect();
                alvo.style.setProperty('--mx', `${clientX - rect.left}px`);
                alvo.style.setProperty('--my', `${clientY - rect.top}px`);
            });
        }
        onMouseMove && onMouseMove(e);
    };

    return (
        <Componente ref={ref} className={`spotlight ${className}`} onMouseMove={moverBrilho} {...props}>
            {children}
        </Componente>
    );
});

export default SpotlightCard;
