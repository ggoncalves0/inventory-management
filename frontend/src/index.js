import React from 'react';
import ReactDOM from 'react-dom/client';
// O CSS global precisa vir antes do App: os CSS dos componentes entram depois e podem sobrescrevê-lo.
import './styles/base.css';
import App from './App';
import { aplicarTema } from './components/ThemeToggle';

// Tema escolhido pelo usuário (se houver) antes do primeiro render, para não piscar
aplicarTema();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
