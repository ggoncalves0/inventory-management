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
- Cadastro, edição e remoção de produtos (restrito ao primeiro usuário registrado — veja a seção [Sobre o usuário administrador](#-sobre-o-usuário-administrador))
- Logout
- Confirmação ao excluir produtos

---

## ✅ Pré-requisitos

Antes de começar, tenha instalado:

- [Node.js](https://nodejs.org) (LTS) — inclui o `npm`
- [Python 3.10+](https://www.python.org/downloads/)
- [MySQL Server](https://dev.mysql.com/downloads/) — Community Server é suficiente
- (Opcional, mas recomendado) [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) para visualizar o banco graficamente

---

## 🔧 Como Rodar o Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/ggoncalves0/inventory-management.git
cd inventory-management
```

### 2. Banco de Dados (MySQL)

Com o MySQL Server instalado e rodando, crie o banco e as tabelas usando o script pronto em `backend/schema.sql`:

```bash
mysql -u root -p < backend/schema.sql
```

Isso cria o banco `inventory_db` com as tabelas `usuarios` e `produtos` já estruturadas.

### 3. Backend (Flask)

Entre na pasta `backend/`:

```bash
cd backend
```

Crie e ative um ambiente virtual:

```bash
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate    # Linux/Mac
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Copie o arquivo de exemplo de variáveis de ambiente e preencha com seus dados:

```bash
copy .env.example .env       # Windows
cp .env.example .env         # Linux/Mac
```

Abra o `.env` recém-criado e ajuste `MYSQL_PASSWORD` para a senha do seu usuário `root` do MySQL (os outros valores já vêm com um padrão razoável para desenvolvimento local). **Os nomes das variáveis precisam ser exatamente esses** (`MYSQL_DB`, `JWT_SECRET_KEY`, etc.) — o `config.py` procura por esses nomes exatos.

Rode o servidor (sempre de dentro da pasta `backend/`, com a venv ativada):

```bash
flask run
```

O backend sobe em `http://localhost:5000`.

### 4. Frontend (React)

Em um **novo terminal** (não precisa da venv aqui, é um projeto separado em Node.js):

```bash
cd frontend
npm install
```

Crie um arquivo `.env` dentro de `frontend/` com:

```
REACT_APP_BASE_URL=http://localhost:5000
```

Rode o projeto:

```bash
npm start
```

O navegador deve abrir automaticamente em `http://localhost:3000`.

---

## 🧪 Testando o fluxo completo

1. Com os dois servidores rodando (backend na porta 5000, frontend na porta 3000), acesse `http://localhost:3000`.
2. Clique em "Registre-se" e crie o primeiro usuário — ele será salvo com `id = 1` e automaticamente se torna o administrador.
3. Faça login com esse usuário. Os botões de "Adicionar Produto", "Editar" e "Excluir" só aparecem para ele (veja a seção abaixo sobre por quê).
4. (Opcional) Registre um segundo usuário para testar o acesso "somente leitura" — ele consegue ver a listagem de produtos, mas não vê os botões de gerenciamento.
5. Cadastre um produto com o usuário admin e confirme que os dados aparecem corretos na listagem.

---

## 👑 Sobre o usuário administrador

Atualmente, o controle de quem pode cadastrar/editar/excluir produtos **não usa um sistema de permissões real** — o código simplesmente verifica se o `id` do usuário logado é igual a `1`:

```python
# backend/routes/products.py
if usuario_id != 1:
    return jsonify({"erro": "Apenas o usuário autorizado pode adicionar produtos."}), 403
```

Ou seja: **o primeiro usuário que se registrar no sistema** (já que os IDs são sequenciais, via `AUTO_INCREMENT`) automaticamente se torna o "administrador". Essa checagem existe tanto no backend (`products.py`, a que realmente importa para segurança) quanto no frontend (`ProductList.js`, só para exibir/esconder os botões).

Essa abordagem funciona para fins de estudo/demonstração, mas tem limitações:
- Não é possível ter mais de um administrador sem reescrever a lógica.
- Se o usuário de `id = 1` for excluído, ninguém mais consegue gerenciar produtos.
- Não escala para um sistema real de múltiplos papéis (ex: admin, editor, visualizador).

Uma evolução natural seria adicionar uma coluna `is_admin` (ou `role`) na tabela `usuarios` e checar esse campo em vez do ID fixo.

---

## 📁 Estrutura de Pastas

```
inventory-management/
├── backend/
│   ├── app.py            # ponto de entrada do Flask
│   ├── config.py         # configuração do MySQL, CORS e JWT
│   ├── schema.sql         # script de criação do banco e tabelas
│   ├── .env.example      # modelo de variáveis de ambiente
│   ├── requirements.txt  # dependências Python
│   └── routes/
│       ├── auth.py       # registro, login, /me
│       └── products.py   # CRUD de produtos
└── frontend/
    ├── src/
    │   ├── components/   # telas e formulários React
    │   └── services/     # cliente Axios com interceptor de JWT
    └── package.json
```

---

## 📌 Observações

- O JWT é salvo no `localStorage` e adicionado automaticamente às requisições via Axios interceptor.
- O backend retorna mensagens de erro em JSON (ex: produto duplicado, credenciais inválidas).
- As senhas são armazenadas com hash `bcrypt`, nunca em texto puro.

---

## 👨‍💻 Autor
Gabriel Gonçalves de Oliveira  
📧 ggoncalvesy03@gmail.com