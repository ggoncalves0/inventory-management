import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../services/api';
import Field from './Field';
import Button from './Button';

const LoginForm = () => {
    const { login } = useAuth();
    // Vindo do cadastro (quando o login automático falha), o usuário já chega preenchido
    const { state } = useLocation();
    const usuarioInicial = state?.username ?? '';
    const [username, setUsername] = useState(usuarioInicial);
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro('');

        if (!username.trim() || !senha) {
            setErro('Preencha usuário e senha.');
            return;
        }

        setCarregando(true);
        try {
            // Após o login o PublicOnlyRoute redireciona para /produtos
            await login(username.trim(), senha);
        } catch (error) {
            setErro(error.response?.status === 401
                ? 'Usuário ou senha incorretos.'
                : mensagemDeErro(error, 'Não foi possível entrar.'));
            setCarregando(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleLogin} noValidate>
            <h1>Entrar</h1>
            <p className="auth-sub">Use seu usuário e senha para acessar o estoque.</p>

            <Field
                label="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={50}
                invalido={!!erro && !username.trim()}
                autoFocus={!usuarioInicial}
            />
            <Field
                label="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                maxLength={72}
                invalido={!!erro && !senha}
                autoFocus={!!usuarioInicial}
            />

            {erro && (
                <p className="form-message erro" role="alert">
                    <CircleAlert size={16} aria-hidden="true" /> {erro}
                </p>
            )}

            <Button type="submit" className="btn-block" carregando={carregando}>
                Entrar
            </Button>

            <p className="auth-switch">
                Não tem conta? <Link to="/register">Criar conta</Link>
            </p>
        </form>
    );
};

export default LoginForm;
