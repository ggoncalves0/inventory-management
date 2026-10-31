# 📦 Sistema de Gerenciamento de Estoque

Este projeto é uma aplicação web para controle de estoque, permitindo cadastrar, visualizar, editar e excluir produtos, com autenticação via JWT.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19 + React Router + Axios + [Motion](https://motion.dev) (animações) + [Lucide](https://lucide.dev) (ícones)
- **Backend:** Flask (Python) + Flask-JWT-Extended + Flask-CORS
- **Banco de Dados:** MySQL
- **Autenticação:** JWT (JSON Web Token)

---

## 🚀 Funcionalidades

- Registro e login de usuários (com medidor de força de senha)
- Painel com indicadores animados: total de produtos, unidades, valor em estoque e itens com estoque baixo
- Busca instantânea por nome, categoria ou `#ID` (atalho `/`), filtro por categoria e ordenação por coluna
- Cadastro, edição e remoção de produtos (restrito a administradores — veja [Sobre o usuário administrador](#-sobre-o-usuário-administrador))
- Modais animados, notificações (toasts), skeleton loading e layout responsivo (tabela vira cartões no celular)
- Respeita a preferência do sistema "reduzir movimento"

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

> **Já tinha o banco da versão anterior?** Rode só a migração que está no final do `schema.sql`:
>
> ```sql
> USE inventory_db;
> ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
> UPDATE usuarios SET is_admin = TRUE WHERE id = 1;
> ```

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

Abra o `.env` recém-criado e ajuste `MYSQL_PASSWORD` para a senha do seu usuário `root` do MySQL. Depois gere uma chave JWT forte e cole em `JWT_SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

> O servidor **se recusa a subir** se `JWT_SECRET_KEY` estiver vazia, tiver menos de 32 caracteres ou for igual ao valor de exemplo. **Os nomes das variáveis precisam ser exatamente esses** (`MYSQL_DB`, `JWT_SECRET_KEY`, etc.) — o `config.py` procura por esses nomes exatos.

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
2. Clique em "Registre-se" e crie o primeiro usuário — ele automaticamente se torna o administrador.
3. Faça login com esse usuário. Os botões de "Novo produto", "Editar" e "Excluir" só aparecem para administradores.
4. (Opcional) Registre um segundo usuário para testar o acesso "somente leitura" — ele consegue ver a listagem de produtos, mas não vê os botões de gerenciamento.
5. Cadastre um produto com o usuário admin e confirme que os dados aparecem corretos na listagem.

---

## 👑 Sobre o usuário administrador

As permissões ficam na coluna `is_admin` da tabela `usuarios`. **O primeiro usuário registrado vira administrador automaticamente**; os demais entram como "somente leitura" (veem a lista, mas não alteram).

Para promover outro usuário, rode no MySQL:

```sql
UPDATE usuarios SET is_admin = TRUE WHERE username = 'nome_do_usuario';
```

A checagem que vale de verdade é a do backend (`admin_required` em `backend/security.py`), que consulta o banco a cada requisição — então remover a permissão de alguém tem efeito imediato. O frontend só usa o `is_admin` retornado por `/me` para mostrar ou esconder os botões.

---

## 🔒 Segurança

- Senhas com hash `bcrypt`; mínimo de 8 caracteres e usuário restrito a `[A-Za-z0-9_.-]` (3–50).
- Login com tempo de resposta constante (não revela se o usuário existe) e **rate limit** por IP no login (10 / 5 min) e registro (5 / 10 min).
- JWT com expiração (`JWT_EXPIRES_HOURS`, padrão 2h); ao expirar, o frontend encerra a sessão sozinho.
- Todas as rotas de produtos exigem autenticação; criar/editar/excluir exige administrador.
- Validação rigorosa de entrada (tamanhos, inteiros, decimais finitos, sem `NaN`/`Infinity`), consultas sempre parametrizadas e `LIKE` com curingas escapados.
- CORS restrito ao `FRONTEND_URL`, limite de 16 KB por requisição, headers de segurança (`nosniff`, `X-Frame-Options`, CSP, `no-store`) e erros em JSON sem stack trace.
- Debug do Flask desligado por padrão (`FLASK_DEBUG=1` para ligar localmente).

**Para produção**, considere ainda: rodar com um servidor WSGI (gunicorn/waitress) atrás de HTTPS, trocar o rate limit em memória por Flask-Limiter + Redis, e servir o build do React com um header `Content-Security-Policy`.

---

## 📁 Estrutura de Pastas

```
inventory-management/
├── backend/
│   ├── app.py            # ponto de entrada, headers de segurança e handlers de erro
│   ├── config.py         # configuração do MySQL, CORS e JWT
│   ├── security.py       # rate limit e checagem de administrador
│   ├── validators.py     # validação de usuários e produtos
│   ├── schema.sql         # script de criação do banco e tabelas
│   ├── .env.example      # modelo de variáveis de ambiente
│   ├── requirements.txt  # dependências Python
│   └── routes/
│       ├── auth.py       # registro, login, /me
│       └── products.py   # CRUD de produtos
└── frontend/
    ├── src/
    │   ├── components/   # telas, modais e componentes visuais
    │   ├── context/      # AuthContext (sessão) e ToastContext (notificações)
    │   ├── services/     # cliente Axios com interceptor de JWT
    │   └── styles/       # base.css (design system), auth.css, dashboard.css
    └── package.json
```

---

## 📌 Observações

- O JWT é salvo no `localStorage` e adicionado automaticamente às requisições via Axios interceptor. Como o React escapa todo conteúdo renderizado (não há `dangerouslySetInnerHTML`), o risco de XSS ler o token é baixo; em produção, cookies `HttpOnly` seriam ainda mais seguros.
- O backend retorna mensagens de erro em JSON (ex: produto duplicado, credenciais inválidas).
- As senhas são armazenadas com hash `bcrypt`, nunca em texto puro.

---

## 👨‍💻 Autor
Gabriel Gonçalves de Oliveira  
📧 ggoncalvesy03@gmail.com