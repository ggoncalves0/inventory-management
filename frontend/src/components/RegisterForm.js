import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { Check, CircleAlert, KeyRound, Lock, User, UserPlus } from 'lucide-react';
import instance, { mensagemDeErro } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Field from './Field';
import Button from './Button';

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
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [erro, setErro] = useState('');
    const [tentou, setTentou] = useState(false);
    const [usuarioEmUso, setUsuarioEmUso] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [escopo, animar] = useAnimate();
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

    const falhar = (mensagem) => {
        setErro(mensagem);
        animar(escopo.current, { x: [0, -10, 10, -7, 7, -3, 3, 0] }, { duration: 0.45 });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setErro('');
        setTentou(true);

        const pendente = regras.find((r) => !r.ok);
        if (pendente) {
            falhar(`Confira: ${pendente.texto.toLowerCase()}.`);
            escopo.current?.querySelector(`[name="${pendente.campo}"]`)?.focus();
            return;
        }

        setCarregando(true);
        try {
            await instance.post('/register', { username: username.trim(), senha });
            setSucesso(true);
        } catch (err) {
            if (err.response?.status === 409) setUsuarioEmUso(true);
            falhar(mensagemDeErro(err, 'Erro ao registrar.'));
        } finally {
            setCarregando(false);
        }
    };

    if (sucesso) {
        return (
            <div className="auth-success">
                <motion.div
                    className="success-badge"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                >
                    <motion.svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path
                            d="M5 12.5l4.5 4.5L19 7.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
                        />
                    </motion.svg>
                </motion.div>
                <h2>Conta criada!</h2>
                <p className="auth-sub">Entrando no painel…</p>
            </div>
        );
    }

    return (
        <form ref={escopo} className="auth-form" onSubmit={handleRegister} noValidate>
            <span className="eyebrow">Novo cadastro</span>
            <h2>Crie sua conta</h2>
            <p className="auth-sub">Leva menos de um minuto.</p>

            <Field
                label="Usuário"
                name="username"
                icon={User}
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
                icon={Lock}
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
                icon={KeyRound}
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
                            <AnimatePresence initial={false}>
                                {r.ok && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                    >
                                        <Check size={11} strokeWidth={3} />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </span>
                        {r.texto}
                    </li>
                ))}
            </ul>

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

            <Button type="submit" icon={UserPlus} className="btn-block" carregando={carregando}>
                Criar conta
            </Button>

            <p className="auth-switch">
                Já possui uma conta? <Link to="/">Faça login</Link>
            </p>
        </form>
    );
}
