import bcrypt
import MySQLdb
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required

from config import mysql
from security import rate_limit, usuario_atual_id
from validators import validar_login, validar_registro

auth_bp = Blueprint('auth', __name__)

# Hash usado quando o usuário não existe, para o login levar o mesmo tempo
# nos dois casos e não revelar quais usernames estão cadastrados.
_HASH_FALSO = bcrypt.hashpw(b'senha-que-nao-existe', bcrypt.gensalt())


@auth_bp.route('/register', methods=['POST'])
@rate_limit(limite=5, janela_segundos=600)
def register():
    data = request.get_json(silent=True) or {}
    credenciais, erro = validar_registro(data)
    if erro:
        return jsonify({"erro": erro}), 400
    username, senha = credenciais

    hashed = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    cur = mysql.connection.cursor()
    try:
        # O primeiro usuário vira admin. Fazer isso num único INSERT ... SELECT
        # evita que dois registros simultâneos virem admin ao mesmo tempo.
        cur.execute(
            "INSERT INTO usuarios (username, senha, is_admin) "
            "SELECT %s, %s, COUNT(*) = 0 FROM usuarios",
            (username, hashed)
        )
        mysql.connection.commit()
    except MySQLdb.IntegrityError:
        mysql.connection.rollback()
        return jsonify({"erro": "Usuário já existe"}), 409
    finally:
        cur.close()

    return jsonify({"mensagem": "Usuário cadastrado com sucesso"}), 201


@auth_bp.route('/login', methods=['POST'])
@rate_limit(limite=10, janela_segundos=300)
def login():
    data = request.get_json(silent=True) or {}
    credenciais, erro = validar_login(data)
    if erro:
        status = 401 if erro == "Credenciais inválidas" else 400
        return jsonify({"erro": erro}), status
    username, senha = credenciais

    cur = mysql.connection.cursor()
    cur.execute("SELECT id, senha FROM usuarios WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()

    hash_salvo = user[1].encode('utf-8') if user else _HASH_FALSO
    senha_ok = bcrypt.checkpw(senha.encode('utf-8'), hash_salvo)

    if not user or not senha_ok:
        return jsonify({"erro": "Credenciais inválidas"}), 401

    access_token = create_access_token(identity=str(user[0]))
    return jsonify(access_token=access_token), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    cur = mysql.connection.cursor()
    cur.execute("SELECT id, username, is_admin FROM usuarios WHERE id = %s", (usuario_atual_id(),))
    user = cur.fetchone()
    cur.close()

    if not user:
        return jsonify({"erro": "Usuário não encontrado"}), 401

    return jsonify({"usuario_id": user[0], "username": user[1], "is_admin": bool(user[2])}), 200
