from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import mysql

produtos_bp = Blueprint('produtos', __name__)


@produtos_bp.route('/produtos', methods=['POST'])
@jwt_required()
def cadastrar_produto():
    usuario_id = int(get_jwt_identity())
    if usuario_id != 1:
        return jsonify({"erro": "Apenas o usuário autorizado pode adicionar produtos."}), 403

    data = request.get_json(silent=True) or {}
    nome = data.get('nome')
    categoria = data.get('categoria')
    quantidade = data.get('quantidade')
    preco = data.get('preco')

    if not nome or not categoria or quantidade is None or preco is None:
        return jsonify({"erro": "Todos os campos (nome, categoria, quantidade e preço são obrigatórios)"}), 400
    try:
        quantidade = int(quantidade)
        preco = float(preco)
    except (ValueError, TypeError):
        return jsonify({"erro": "Quantidade deve ser um número inteiro e preço deve ser um número decimal"}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM produtos WHERE nome = %s", (nome,))
    if cur.fetchone():
        cur.close()
        return jsonify({"erro": "Um produto com este nome já está cadastrado!"}), 409

    cur.execute(
        "INSERT INTO produtos (nome, categoria, quantidade, preco, usuario_id) VALUES (%s, %s, %s, %s, %s)",
        (nome, categoria, quantidade, preco, usuario_id)
    )
    mysql.connection.commit()
    cur.close()

    return jsonify({"mensagem": "Produto cadastrado com sucesso!"})


@produtos_bp.route('/produtos', methods=['GET'])
def listar_produtos():
    id = request.args.get('id')
    nome = request.args.get('nome')
    categoria = request.args.get('categoria')

    cur = mysql.connection.cursor()

    query = "SELECT * FROM produtos WHERE 1=1"
    params = []

    if id:
        query += " AND id = %s"
        params.append(id)
    if nome:
        query += " AND nome LIKE %s"
        params.append(f"%{nome}%")
    if categoria:
        query += " AND categoria LIKE %s"
        params.append(f"%{categoria}%")

    cur.execute(query, tuple(params))
    produtos = cur.fetchall()
    cur.close()

    lista_produtos = [
        {"id": p[0], "nome": p[1], "categoria": p[2], "quantidade": p[3], "preco": p[4]}
        for p in produtos
    ]
    return jsonify(lista_produtos)


@produtos_bp.route('/produtos/<int:id>', methods=['GET'])
def busca_produto(id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM produtos WHERE id = %s", (id,))
    produto = cur.fetchone()
    cur.close()
    if produto:
        return jsonify({"id": produto[0], "nome": produto[1], "categoria": produto[2], "quantidade": produto[3], "preco": produto[4]})
    else:
        return jsonify({"erro": "Produto não encontrado"}), 404


@produtos_bp.route('/produtos/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_produto(id):
    usuario_id = int(get_jwt_identity())
    if usuario_id != 1:
        return jsonify({"erro": "Apenas o usuário autorizado pode editar produtos."}), 403

    data = request.get_json(silent=True) or {}
    nome = data.get('nome')
    categoria = data.get('categoria')
    quantidade = data.get('quantidade')
    preco = data.get('preco')

    if not nome or not categoria or quantidade is None or preco is None:
        return jsonify({"erro": "Todos os campos (nome, categoria, quantidade e preço são obrigatórios)"}), 400
    try:
        quantidade = int(quantidade)
        preco = float(preco)
    except (ValueError, TypeError):
        return jsonify({"erro": "Quantidade deve ser um número inteiro e preço deve ser um número decimal"}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM produtos WHERE id = %s", (id,))
    produto = cur.fetchone()

    if not produto:
        cur.close()
        return jsonify({'erro': 'Produto não encontrado'}), 404

    cur.execute("SELECT * FROM produtos WHERE nome = %s AND id != %s", (nome, id))
    if cur.fetchone():
        cur.close()
        return jsonify({"erro": 'Já existe um produto com esse nome'}), 400

    cur.execute("UPDATE produtos SET nome = %s, categoria = %s, quantidade = %s, preco = %s WHERE id = %s",
                (nome, categoria, quantidade, preco, id))
    mysql.connection.commit()
    cur.close()

    return jsonify({'mensagem': 'Produto atualizado com sucesso'})


@produtos_bp.route('/produtos/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_produto(id):
    usuario_id = int(get_jwt_identity())
    if usuario_id != 1:
        return jsonify({"erro": "Apenas o usuário autorizado pode excluir produtos."}), 403

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM produtos WHERE id = %s", (id,))
    produto = cur.fetchone()

    if not produto:
        cur.close()
        return jsonify({"erro": "Produto não encontrado ou já foi removido"}), 404

    cur.execute("DELETE FROM produtos WHERE id = %s", (id,))
    mysql.connection.commit()
    cur.close()

    return jsonify({"mensagem": f"Produto com id {id} removido com sucesso!"})


@produtos_bp.route('/produtos', methods=['DELETE'])
def deletar_sem_id():
    return jsonify({"erro": "É necessário informar o ID do produto que deseja excluir!"}), 400
