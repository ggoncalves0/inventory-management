import MySQLdb
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from config import mysql
from security import admin_required, usuario_atual_id
from validators import escapar_like, validar_produto

produtos_bp = Blueprint('produtos', __name__)

COLUNAS = "id, nome, categoria, quantidade, preco"
LIMITE_LISTAGEM = 1000


def _serializar(p):
    return {"id": p[0], "nome": p[1], "categoria": p[2], "quantidade": p[3], "preco": str(p[4])}


def _nome_em_uso(cur, nome, ignorar_id=None):
    if ignorar_id is None:
        cur.execute("SELECT 1 FROM produtos WHERE nome = %s", (nome,))
    else:
        cur.execute("SELECT 1 FROM produtos WHERE nome = %s AND id != %s", (nome, ignorar_id))
    return cur.fetchone() is not None


@produtos_bp.route('/produtos', methods=['POST'])
@admin_required
def cadastrar_produto():
    produto, erro = validar_produto(request.get_json(silent=True) or {})
    if erro:
        return jsonify({"erro": erro}), 400

    cur = mysql.connection.cursor()
    try:
        if _nome_em_uso(cur, produto['nome']):
            return jsonify({"erro": "Um produto com este nome já está cadastrado!"}), 409

        cur.execute(
            "INSERT INTO produtos (nome, categoria, quantidade, preco, usuario_id) VALUES (%s, %s, %s, %s, %s)",
            (produto['nome'], produto['categoria'], produto['quantidade'], produto['preco'], usuario_atual_id())
        )
        mysql.connection.commit()
        novo_id = cur.lastrowid
    except MySQLdb.IntegrityError:
        mysql.connection.rollback()
        return jsonify({"erro": "Um produto com este nome já está cadastrado!"}), 409
    finally:
        cur.close()

    return jsonify({"mensagem": "Produto cadastrado com sucesso!", "id": novo_id}), 201


@produtos_bp.route('/produtos', methods=['GET'])
@jwt_required()
def listar_produtos():
    id = request.args.get('id', '').strip()
    nome = request.args.get('nome', '').strip()
    categoria = request.args.get('categoria', '').strip()

    filtros = " WHERE 1=1"
    params = []

    if id:
        if not id.isdigit():
            return jsonify([])
        filtros += " AND id = %s"
        params.append(int(id))
    if nome:
        filtros += " AND nome LIKE %s"
        params.append(f"%{escapar_like(nome[:100])}%")
    if categoria:
        filtros += " AND categoria LIKE %s"
        params.append(f"%{escapar_like(categoria[:50])}%")

    cur = mysql.connection.cursor()
    # Total real com os mesmos filtros, sem o LIMIT: a tela avisa quando a lista foi cortada,
    # em vez de somar só os primeiros LIMITE_LISTAGEM achando que é o estoque todo.
    cur.execute(f"SELECT COUNT(*) FROM produtos{filtros}", tuple(params))
    total = cur.fetchone()[0]
    cur.execute(f"SELECT {COLUNAS} FROM produtos{filtros} ORDER BY id LIMIT %s", (*params, LIMITE_LISTAGEM))
    produtos = cur.fetchall()
    cur.close()

    resposta = jsonify([_serializar(p) for p in produtos])
    resposta.headers['X-Total-Count'] = str(total)
    return resposta


@produtos_bp.route('/produtos/<int:id>', methods=['GET'])
@jwt_required()
def busca_produto(id):
    cur = mysql.connection.cursor()
    cur.execute(f"SELECT {COLUNAS} FROM produtos WHERE id = %s", (id,))
    produto = cur.fetchone()
    cur.close()
    if produto:
        return jsonify(_serializar(produto))
    return jsonify({"erro": "Produto não encontrado"}), 404


@produtos_bp.route('/produtos/<int:id>', methods=['PUT'])
@admin_required
def atualizar_produto(id):
    produto, erro = validar_produto(request.get_json(silent=True) or {})
    if erro:
        return jsonify({"erro": erro}), 400

    cur = mysql.connection.cursor()
    try:
        cur.execute("SELECT 1 FROM produtos WHERE id = %s", (id,))
        if not cur.fetchone():
            return jsonify({'erro': 'Produto não encontrado'}), 404

        if _nome_em_uso(cur, produto['nome'], ignorar_id=id):
            return jsonify({"erro": 'Já existe um produto com esse nome'}), 409

        cur.execute(
            "UPDATE produtos SET nome = %s, categoria = %s, quantidade = %s, preco = %s WHERE id = %s",
            (produto['nome'], produto['categoria'], produto['quantidade'], produto['preco'], id)
        )
        mysql.connection.commit()
    except MySQLdb.IntegrityError:
        mysql.connection.rollback()
        return jsonify({"erro": 'Já existe um produto com esse nome'}), 409
    finally:
        cur.close()

    return jsonify({'mensagem': 'Produto atualizado com sucesso'})


@produtos_bp.route('/produtos/<int:id>', methods=['DELETE'])
@admin_required
def deletar_produto(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM produtos WHERE id = %s", (id,))
    removidos = cur.rowcount
    mysql.connection.commit()
    cur.close()

    if not removidos:
        return jsonify({"erro": "Produto não encontrado ou já foi removido"}), 404
    return jsonify({"mensagem": f"Produto com id {id} removido com sucesso!"})


@produtos_bp.route('/produtos', methods=['DELETE'])
def deletar_sem_id():
    return jsonify({"erro": "É necessário informar o ID do produto que deseja excluir!"}), 400
