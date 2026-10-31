import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

USERNAME_RE = re.compile(r'^[A-Za-z0-9_.-]{3,50}$')
SENHA_MIN = 8
SENHA_MAX_BYTES = 72  # limite do bcrypt; acima disso o bcrypt 5 lança ValueError

NOME_MAX = 100
CATEGORIA_MAX = 50
QUANTIDADE_MAX = 2_147_483_647  # INT do MySQL
PRECO_MAX = Decimal('99999999.99')  # DECIMAL(10,2)


def _texto(data, campo):
    valor = data.get(campo)
    return valor.strip() if isinstance(valor, str) else None


def validar_registro(data):
    username = _texto(data, 'username')
    senha = data.get('senha')

    if not username or not isinstance(senha, str) or not senha:
        return None, "Usuário e senha são obrigatórios"
    if not USERNAME_RE.match(username):
        return None, "Usuário deve ter de 3 a 50 caracteres: letras, números, ponto, hífen ou underline"
    if len(senha) < SENHA_MIN:
        return None, f"A senha deve ter pelo menos {SENHA_MIN} caracteres"
    if len(senha.encode('utf-8')) > SENHA_MAX_BYTES:
        return None, "A senha é longa demais (máximo 72 bytes)"
    return (username, senha), None


def validar_login(data):
    username = _texto(data, 'username')
    senha = data.get('senha')

    if not username or not isinstance(senha, str) or not senha:
        return None, "Usuário e senha são obrigatórios"
    if len(username) > 50 or len(senha.encode('utf-8')) > SENHA_MAX_BYTES:
        return None, "Credenciais inválidas"
    return (username, senha), None


def _inteiro(valor):
    # bool é subclasse de int em Python; True não deve virar quantidade 1
    if isinstance(valor, bool):
        raise ValueError
    if isinstance(valor, int):
        return valor
    if isinstance(valor, str) and re.fullmatch(r'\s*\d+\s*', valor):
        return int(valor)
    if isinstance(valor, float) and valor.is_integer():
        return int(valor)
    raise ValueError


def _decimal(valor):
    if isinstance(valor, bool) or not isinstance(valor, (int, float, str)):
        raise ValueError
    try:
        numero = Decimal(str(valor).strip().replace(',', '.'))
    except InvalidOperation:
        raise ValueError
    if not numero.is_finite():
        raise ValueError
    return numero.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def validar_produto(data):
    nome = _texto(data, 'nome')
    categoria = _texto(data, 'categoria')
    quantidade = data.get('quantidade')
    preco = data.get('preco')

    if not nome or not categoria or quantidade in (None, '') or preco in (None, ''):
        return None, "Todos os campos (nome, categoria, quantidade e preço) são obrigatórios"
    if len(nome) > NOME_MAX:
        return None, f"O nome pode ter no máximo {NOME_MAX} caracteres"
    if len(categoria) > CATEGORIA_MAX:
        return None, f"A categoria pode ter no máximo {CATEGORIA_MAX} caracteres"

    try:
        quantidade = _inteiro(quantidade)
        preco = _decimal(preco)
    except ValueError:
        return None, "Quantidade deve ser um número inteiro e preço deve ser um número decimal"

    if not 0 <= quantidade <= QUANTIDADE_MAX:
        return None, "Quantidade fora do intervalo permitido"
    if not Decimal('0') <= preco <= PRECO_MAX:
        return None, "Preço fora do intervalo permitido"

    return {"nome": nome, "categoria": categoria, "quantidade": quantidade, "preco": preco}, None


def escapar_like(texto):
    """Impede que % e _ digitados pelo usuário virem curingas no LIKE."""
    return texto.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
