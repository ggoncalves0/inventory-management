import { useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Layers, ShieldCheck, TrendingUp, TriangleAlert, Wallet, Zap } from 'lucide-react';
import Logo from './Logo';
import SpotlightCard from './SpotlightCard';
import '../styles/auth.css';

// Congela o conteúdo da rota para que a tela que sai continue visível durante a animação.
function FrozenOutlet() {
    const outlet = useOutlet();
    const [congelado] = useState(outlet);
    return congelado;
}

const destaques = [
    { icon: Zap, texto: 'Busca instantânea por nome, categoria ou ID' },
    { icon: TrendingUp, texto: 'Indicadores de valor e nível de estoque em tempo real' },
    { icon: ShieldCheck, texto: 'Acesso protegido com JWT e permissões por papel' },
];

const cartoesFlutuantes = [
    { icon: Layers, rotulo: 'Unidades em estoque', valor: '12.480', classe: 'float-a', cor: 'violet' },
    { icon: Wallet, rotulo: 'Valor do inventário', valor: 'R$ 284,9 mil', classe: 'float-b', cor: 'cyan' },
    { icon: TriangleAlert, rotulo: 'Estoque baixo', valor: '3 itens', classe: 'float-c', cor: 'rose' },
];

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

const AuthLayout = () => {
    const { pathname } = useLocation();

    return (
        <motion.div
            className="auth-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.35 } }}
        >
            <motion.aside className="auth-hero" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}><Logo /></motion.div>

                <div className="auth-hero-copy">
                    <motion.span variants={item} className="pill">
                        <span className="pill-dot" /> Gestão de inventário
                    </motion.span>
                    <motion.h1 variants={item}>
                        Seu estoque, <span className="gradient-text">sob controle</span> e em movimento.
                    </motion.h1>
                    <motion.p variants={item} className="auth-hero-sub">
                        Cadastre, acompanhe e ajuste seus produtos em um painel rápido, bonito e seguro.
                    </motion.p>
                    <motion.ul variants={item} className="auth-features">
                        {destaques.map(({ icon: Icon, texto }) => (
                            <li key={texto}><span><Icon size={15} /></span>{texto}</li>
                        ))}
                    </motion.ul>
                </div>

                <div className="auth-floating" aria-hidden="true">
                    {cartoesFlutuantes.map(({ icon: Icon, rotulo, valor, classe, cor }, i) => (
                        <motion.div
                            key={rotulo}
                            className={`float-card ${classe}`}
                            initial={{ opacity: 0, y: 40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 200, damping: 22 }}
                        >
                            <span className={`float-icon ${cor}`}><Icon size={16} /></span>
                            <div>
                                <small>{rotulo}</small>
                                <strong>{valor}</strong>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.aside>

            <main className="auth-main">
                <div className="auth-mobile-logo"><Logo /></div>
                <SpotlightCard
                    className="auth-card"
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.1 }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <FrozenOutlet />
                        </motion.div>
                    </AnimatePresence>
                </SpotlightCard>
            </main>
        </motion.div>
    );
};

export default AuthLayout;
