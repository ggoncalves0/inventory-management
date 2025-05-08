# 📦 Sistema de Gerenciamento de Estoque

Este projeto é uma aplicação web para controle de estoque, permitindo cadastrar, visualizar, editar e excluir produtos, com autenticação via JWT.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React (com Axios)
- **Backend:** Flask (Python) + Flask-JWT-Extended + Flask-CORS
- **Banco de Dados:** MySQL
- **Autenticação:** JWT (JSON Web Token)

---

## 🚀 Funcionalidades

- Registro e login de usuários
- Visualização de produtos (aberto a todos os usuários autenticados)
- Cadastro, edição e remoção de produtos (restrito ao usuário com ID 2)
- Logout
- Confirmação ao excluir produtos

---

## 🔧 Como Rodar o Projeto

### Backend (Flask)

1. Crie e ative um ambiente virtual:

```bash
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate no Windows
```

2. Configure a conexão com o MySQL em `app.py`

3. Rode o servidor:

```bash
flask run
```

### Frontend (React)

1. Vá até a pasta `frontend/`

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Rode o projeto:

```bash
npm run dev
```

---

## ✅ Requisitos

- Node.js
- Python 3.10+
- MySQL Server

---

## 📌 Observações

- Apenas o usuário com ID 2 pode cadastrar, editar ou excluir produtos.
- O JWT é salvo no `localStorage` e adicionado automaticamente às requisições via Axios interceptor.
- O backend retorna mensagens de erro em JSON (ex: produto duplicado).

---


## 👨‍💻 Autor
Gabriel Gonçalves de Oliveira  
📧 ggoncalvesy03@gmail.com
