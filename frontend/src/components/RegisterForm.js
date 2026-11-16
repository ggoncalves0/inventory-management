import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CircleAlert, CircleCheck } from 'lucide-react';
import instance, { mensagemDeErro } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Field from './Field';
import Button from './Button';
import useTituloDaPagina from '../utils/useTituloDaPagina';

// Mesmas regras do backend (validators.py)
const USERNAME_RE = /^[A-Za-z0-9_.-]{3,50}$/;
const SENHA_MIN = 8;

const NIVEIS = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

function forcaDaSenha(senha) {
    if (!senha) return 0;
    let pontos = 0;
    if (senha.length >= SENHA_MIN) pontos++;
    if (senha.length >= 12) pontos++;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
    if (/\d/.test(senha)) pontos++;
    if (/[^A-Za-z0-9]/.test(senha)) pontos++;
    return Math.min(4, pontos);
}

export default function RegisterForm() {
    useTituloDaPagina('Criar conta');
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [erro, setErro] = useState('');
    const [tentou, setTentou] = useState(false);
    const [usuarioEmUso, setUsuarioEmUso] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const escopo = useRef(null);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { mostrarToast } = useToast();
    const idRegras = useId();

    const forca = forcaDaSenha(senha);
    const regras = useMemo(() => [
        { campo: 'username', ok: USERNAME_RE.test(username.trim()), texto: 'Usuário com 3–50 letras, números, ".", "-" ou "_"' },
        { campo: 'senha', ok: senha.length >= SENHA_MIN, texto: `Senha com pelo menos ${SENHA_MIN} caracteres` },
        { campo: 'confirmacao', ok: !!senha && senha === confirmacao, texto: 'As senhas coincidem' },
    ], [username, senha, confirmacao]);

    // Depois da primeira tentativa de envio, cada campo fica marcado enquanto a regra dele não for cumprida
    const invalido = (campo) => tentou && !regras.find((r) => r.campo === campo).ok;
    const idRegra = (campo) => `${idRegras}-${campo}`;

    // Conta criada: entra direto no painel. Se o login falhar, vai para a tela de login já com o usuário.
    useEffect(() => {
        if (!sucesso) return;
        const nome = username.trim();
        const t = setTimeout(async () => {
            try {
                await login(nome, senha);
                mostrarToast('sucesso', 'Conta criada. Boas-vindas ao painel!');
            } catch {
                mostrarToast('sucesso', 'Conta criada! Faça login para continuar.');
                navigate('/', { state: { username: nome } });
            }
        }, 1200);
        return () => clearTimeout(t);
    }, [sucesso, username, senha, login, mostrarToast, navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setErro('');
        setTentou(true);

        const pendente = regras.find((r) => !r.ok);
        if (pendente) {
            setErro(`Confira: ${pendente.texto.toLowerCase()}.`);
            escopo.current?.querySelector(`[name="${pendente.campo}"]`)?.focus();
            return;
        }

        setCarregando(true);
        try {
            await instance.post('/register', { username: username.trim(), senha });
            setSucesso(true);
        } catch (err) {
            if (err.response?.status === 409) setUsuarioEmUso(true);
            setErro(mensagemDeErro(err, 'Erro ao registrar.'));
        } finally {
            setCarregando(false);
        }
    };

    if (sucesso) {
        return (
            <div className="auth-success">
                <CircleCheck size={32} aria-hidden="true" />
                <h1>Conta criada</h1>
                <p className="auth-sub">Entrando no painel…</p>
            </div>
        );
    }

    return (
        <form ref={escopo} className="auth-form" onSubmit={handleRegister} noValidate>
            <h1>Criar conta</h1>
            <p className="auth-sub">Escolha um nome de usuário e uma senha.</p>

            <Field
                label="Usuário"
                name="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsuarioEmUso(false); }}
                autoComplete="username"
                maxLength={50}
                invalido={invalido('username') || usuarioEmUso}
                aria-describedby={idRegra('username')}
                autoFocus
            />
            <Field
                label="Senha"
                name="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                maxLength={72}
                invalido={invalido('senha')}
                aria-describedby={idRegra('senha')}
            />

            <div className={`strength level-${forca}`} aria-live="polite">
                <div className="strength-bars">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={i < forca ? 'on' : ''} />
                    ))}
                </div>
                <small>{senha ? NIVEIS[forca] : 'Força da senha'}</small>
            </div>

            <Field
                label="Confirmar senha"
                name="confirmacao"
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                autoComplete="new-password"
                maxLength={72}
                invalido={invalido('confirmacao')}
                aria-describedby={idRegra('confirmacao')}
            />

            <ul className="rules">
                {regras.map((r) => (
                    <li key={r.campo} id={idRegra(r.campo)} className={r.ok ? 'ok' : ''}>
                        <span className="rule-check" aria-hidden="true">
                            {r.ok && <Check size={10} strokeWidth={3} />}
                        </span>
                        {r.texto}
                    </li>
                ))}
            </ul>

            {erro && (
                <p className="form-message erro" role="alert">
                    <CircleAlert size={16} aria-hidden="true" /> {erro}
                </p>
            )}

            <Button type="submit" className="btn-block" carregando={carregando}>
                Criar conta
            </Button>

            <p className="auth-switch">
                Já tem conta? <Link to="/">Entrar</Link>
            </p>
        </form>
    );
}
