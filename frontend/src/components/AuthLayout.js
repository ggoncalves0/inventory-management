import { useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import '../styles/auth.css';

// Congela o conteúdo da rota para que a tela que sai continue visível durante a transição.
function FrozenOutlet() {
    const outlet = useOutlet();
    const [congelado] = useState(outlet);
    return congelado;
}

const AuthLayout = () => {
    const { pathname } = useLocation();

    return (
        <motion.div className="auth-page" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            <aside className="auth-marca">
                <Logo />
                <div className="auth-marca-texto">
                    <p className="auth-marca-titulo">Saiba o que tem, quanto vale e o que está acabando.</p>
                    <p>Cadastro de produtos, níveis de estoque e valor por categoria em uma tela só.</p>
                </div>
            </aside>

            <main className="auth-main">
                <ThemeToggle className="auth-tema" />
                <div className="auth-mobile-logo"><Logo /></div>
                <div className="auth-card cantoneiras">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                        >
                            <FrozenOutlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </motion.div>
    );
};

export default AuthLayout;
