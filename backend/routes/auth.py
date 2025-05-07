from flask import Blueprint, request, jsonify
from config import mysql
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    senha = data.get('senha')

    if not username or not senha:
        return jsonify({"erro": "Usuário e senha são obrigatórios"}), 400

    hashed = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM usuarios WHERE username = %s", (username,))
    if cur.fetchone():
        return jsonify({"erro": "Usuário já existe"}), 409

    cur.execute("INSERT INTO usuarios (username, senha) VALUES (%s, %s)", (username, hashed))
    mysql.connection.commit()
    cur.close()

    return jsonify({"mensagem": "Usuário cadastrado com sucesso"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    senha = data.get('senha')

    if not username or not senha:
        return jsonify({"erro": "Usuário e senha são obrigatórios"}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT id, senha FROM usuarios WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()

    if not user or not bcrypt.checkpw(senha.encode('utf-8'), user[1].encode('utf-8')):
        return jsonify({"erro": "Credenciais inválidas"}), 401

    access_token = create_access_token(identity=str(user[0]))
    return jsonify(access_token=access_token, usuario_id=user[0]), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    usuario_id = get_jwt_identity()
    return jsonify({"usuario_id": usuario_id}), 200
