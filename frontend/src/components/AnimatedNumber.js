import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

// Anima a contagem do valor anterior até o novo. `formatar` deve ser estável (definido fora do componente).
const AnimatedNumber = ({ valor, formatar }) => {
    const ref = useRef(null);
    const anterior = useRef(0);
    const reduzir = useReducedMotion();

    useEffect(() => {
        const controle = animate(anterior.current, valor, {
            duration: reduzir ? 0 : 1.1,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => {
                if (ref.current) ref.current.textContent = formatar(v);
            },
        });
        anterior.current = valor;
        return () => controle.stop();
    }, [valor, formatar, reduzir]);

    return <span ref={ref}>{formatar(0)}</span>;
};

export default AnimatedNumber;
