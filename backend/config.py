import os
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mysqldb import MySQL

load_dotenv()

PLACEHOLDER_SECRET = 'troque_por_uma_string_aleatoria_grande'


def _carregar_jwt_secret():
    """Recusa subir o servidor com uma chave JWT ausente, curta ou igual ao exemplo."""
    secret = os.getenv('JWT_SECRET_KEY', '')
    if len(secret) < 32 or secret == PLACEHOLDER_SECRET:
        raise RuntimeError(
            'JWT_SECRET_KEY ausente ou fraca (mínimo 32 caracteres). Gere uma com:\n'
            '  python -c "import secrets; print(secrets.token_urlsafe(64))"\n'
            'e coloque no arquivo backend/.env'
        )
    return secret


app = Flask(__name__)

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# O token vai no header Authorization, então não precisamos de cookies cross-origin.
CORS(
    app,
    resources={r"/*": {"origins": [FRONTEND_URL]}},
    allow_headers=['Content-Type', 'Authorization'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    max_age=600,
)

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')
app.config['MYSQL_CHARSET'] = 'utf8mb4'

app.config['JWT_SECRET_KEY'] = _carregar_jwt_secret()
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=int(os.getenv('JWT_EXPIRES_HOURS', '2')))
app.config['JWT_TOKEN_LOCATION'] = ['headers']

# Nenhuma rota precisa de payloads grandes; corta abuso logo na entrada.
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024
app.json.ensure_ascii = False

mysql = MySQL(app)
jwt = JWTManager(app)
