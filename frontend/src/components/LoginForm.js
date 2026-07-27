import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import instance from '../services/api';
import '../styles/login.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

const handleLogin = async (e) => {
        e.preventDefault();
        setErro('');

        if (!username || !senha) {
            setErro('Preencha usuário e senha.');
            return;
        }

        try {
            const response = await instance.post('/login', {
                username,
                senha
            });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('usuario_id', response.data.usuario_id);
            navigate('/produtos');
        } catch (error) {
            setErro('Usuário ou senha incorretos');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin} noValidate>
                <h2>Login</h2>

                <label>Usuário</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label>Senha</label>
                <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />

                <button type="submit" style={{fontSize: '1rem', padding: '10px 0'}}>Entrar</button>

                {erro && <p className="form-message erro">{erro}</p>}

                <p style={{ marginTop: '1rem'}}>
                    Não possui uma conta?{' '}
                    <button
                        type="button"
                        className="link-button"
                        onClick={() => navigate('/register')}
                    >
                        Registre-se
                    </button>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
