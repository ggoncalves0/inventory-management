import { ArrowRight, X } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import AnimatedNumber from './AnimatedNumber';

export const statVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

// Só o cartão com onClick reage ao hover (e vira <button>); os demais são informativos.
// Dentro de <button> só cabe conteúdo de frase, por isso spans no lugar de divs.
const StatCard = ({ icon: Icon, rotulo, valor, formatar, detalhe, cor, titulo, alerta = false, onClick, ativo = false, acao }) => {
    const interativo = !!onClick;
    const classes = ['stat-card', cor, interativo && 'interativo', ativo && 'ativo', alerta && 'alerta'].filter(Boolean).join(' ');

    return (
        <SpotlightCard
            as={interativo ? 'button' : 'div'}
            type={interativo ? 'button' : undefined}
            className={classes}
            variants={statVariants}
            whileHover={interativo ? { y: -4 } : undefined}
            whileTap={interativo ? { scale: 0.98 } : undefined}
            onClick={onClick}
            aria-pressed={interativo ? ativo : undefined}
        >
            <span className="stat-top">
                <span className="stat-label">{rotulo}</span>
                <span className="stat-icon"><Icon size={18} aria-hidden="true" /></span>
            </span>
            <strong className="stat-value" title={titulo}>
                <AnimatedNumber valor={valor} formatar={formatar} />
            </strong>
            {(detalhe || acao) && (
                <span className="stat-rodape">
                    {detalhe && <span className="stat-detail">{detalhe}</span>}
                    {acao && (
                        <span className="stat-acao">
                            {acao}
                            {ativo ? <X size={13} aria-hidden="true" /> : <ArrowRight size={13} aria-hidden="true" />}
                        </span>
                    )}
                </span>
            )}
        </SpotlightCard>
    );
};

export default StatCard;
