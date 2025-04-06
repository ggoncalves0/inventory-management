from flask import Blueprint, request, jsonify
from config import app, mysql

produtos_bp = Blueprint('produtos', __name__)

# Endpoint cadastrar um produto


@app.route('/produtos', methods=['POST'])
def cadastrar_produto():
    data = request.json
    nome = data['nome']
    categoria = data['categoria']
    quantidade = data['quantidade']
    preco = data['preco']
    if not nome or not categoria or not quantidade or not preco:
        return jsonify({"erro": "Todos os campos (nome, categoria, quantidade e preço são obrigatórios)"}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM produtos WHERE nome = %s", (nome,))
    produto_existente = cur.fetchone()
    if produto_existente:
        cur.close()
        return jsonify({"erro": "Um produto com este nome já está cadastrado!"}), 409
    cur.execute(
        "INSERT INTO produtos (nome, categoria, quantidade, preco) VALUES (%s, %s, %s, %s)",
        (nome, categoria, quantidade, preco)
    )
    mysql.connection.commit()
    cur.close()

    return jsonify({"mensagem": "Produto cadastrado com sucesso!"})

# Endpoint listar produtos


@app.route('/produtos', methods=['GET'])
@app.route('/produtos', methods=['GET'])
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


@app.route('/produtos/<int:id>', methods=['GET'])
def busca_produtos(id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM produtos WHERE id = %s", (id,))
    produto = cur.fetchone()
    cur.close()
    if produto:
        return jsonify({"id": produto[0], "nome": produto[1], "quantidade": produto[2], "preco": produto[3]})
    else:
        return jsonify({"erro": "Produto não encontrado"}), 404


# Endpoint editar produtos

@app.route('/produtos/<int:id>', methods=['PUT'])
def atualizar_produtos(id):
    data = request.get_json()
    nome = data.get('nome')
    categoria = data.get('categoria')
    quantidade = data.get('quantidade')
    preco = data.get('preco')
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM produtos WHERE id = %s", (id,))
    produto = cur.fetchone()

    if not produto:
        return jsonify({'erro': 'Produto não encontrado'}), 404
    cur.execute("SELECT * FROM produtos WHERE nome = %s AND id != %s", (nome, id))
    if cur.fetchone():
        return jsonify({"erro": 'Já existe um produto com esse nome'}), 400
    cur.execute("UPDATE produtos SET nome = %s, categoria = %s, quantidade = %s, preco = %s WHERE id = %s", (nome, categoria, quantidade, preco, id))
    mysql.connection.commit()
    cur.close()
    return jsonify({'mensagem': 'Produto Atualizado com sucesso'})


# Endpoint excluir produtos

@app.route('/produtos/<int:id>', methods=['DELETE'])
def deletar_produto(id):
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


@app.route('/produtos', methods=['DELETE'])
def deletar_sem_id():
    return jsonify({"erro": "É necessário informar o ID do produto que deseja excluir!"}), 400


if __name__ == '__main__':
    app.run(debug=True)
