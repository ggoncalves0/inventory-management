import { motion } from 'motion/react';
import SpotlightCard from './SpotlightCard';
import AnimatedNumber from './AnimatedNumber';

export const statVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

const StatCard = ({ icon: Icon, rotulo, valor, formatar, detalhe, cor }) => (
    <SpotlightCard className={`stat-card ${cor}`} variants={statVariants} whileHover={{ y: -4 }}>
        <div className="stat-top">
            <span className="stat-label">{rotulo}</span>
            <motion.span
                className="stat-icon"
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
                <Icon size={18} />
            </motion.span>
        </div>
        <strong className="stat-value">
            <AnimatedNumber valor={valor} formatar={formatar} />
        </strong>
        {detalhe && <span className="stat-detail">{detalhe}</span>}
    </SpotlightCard>
);

export default StatCard;
