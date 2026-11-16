import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { ArrowRight, CircleAlert, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../services/api';
import Field from './Field';
import Button from './Button';

const tremer = { x: [0, -10, 10, -7, 7, -3, 3, 0] };

const LoginForm = () => {
    const { login } = useAuth();
    // Vindo do cadastro (quando o login automático falha), o usuário já chega preenchido
    const { state } = useLocation();
    const usuarioInicial = state?.username ?? '';
    const [username, setUsername] = useState(usuarioInicial);
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [escopo, animar] = useAnimate();

    const falhar = (mensagem) => {
        setErro(mensagem);
        animar(escopo.current, tremer, { duration: 0.45 });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro('');

        if (!username.trim() || !senha) {
            falhar('Preencha usuário e senha.');
            return;
        }

        setCarregando(true);
        try {
            // Após o login o PublicOnlyRoute redireciona para /produtos
            await login(username.trim(), senha);
        } catch (error) {
            falhar(error.response?.status === 401
                ? 'Usuário ou senha incorretos.'
                : mensagemDeErro(error, 'Não foi possível entrar.'));
            setCarregando(false);
        }
    };

    return (
        <form ref={escopo} className="auth-form" onSubmit={handleLogin} noValidate>
            <span className="eyebrow">Acesso</span>
            <h2>Bem-vindo de volta</h2>
            <p className="auth-sub">Entre com suas credenciais para acessar o painel.</p>

            <Field
                label="Usuário"
                icon={User}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={50}
                invalido={!!erro && !username.trim()}
                autoFocus={!usuarioInicial}
            />
            <Field
                label="Senha"
                icon={Lock}
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                maxLength={72}
                invalido={!!erro && !senha}
                autoFocus={!!usuarioInicial}
            />

            <AnimatePresence>
                {erro && (
                    <motion.p
                        className="form-message erro"
                        role="alert"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    >
                        <CircleAlert size={16} /> {erro}
                    </motion.p>
                )}
            </AnimatePresence>

            <Button type="submit" className="btn-block" carregando={carregando}>
                Entrar <ArrowRight size={17} className="btn-arrow" aria-hidden="true" />
            </Button>

            <p className="auth-switch">
                Não possui uma conta? <Link to="/register">Registre-se</Link>
            </p>
        </form>
    );
};

export default LoginForm;
