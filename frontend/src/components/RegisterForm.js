import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/register.css';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!username || !senha) {
      setErro('Preencha usuário e senha.');
      return;
    }

    try {
      await api.post('/register', { username, senha });
      setSucesso('Conta registrada com sucesso! Redirecionando para o login...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setErro('Erro ao registrar, Usuário já existe');
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleRegister} noValidate>
        <h2>Registrar</h2>
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={!!sucesso}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          disabled={!!sucesso}
        />
        <button type="submit" disabled={!!sucesso}>Registrar</button>
        <p>
          Já possui uma conta? <Link to="/">Faça login</Link>
        </p>
        {erro && <p className="form-message erro">{erro}</p>}
        {sucesso && <p className="form-message sucesso">{sucesso}</p>}
      </form>
    </div>
  );
}