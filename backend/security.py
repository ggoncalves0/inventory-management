import threading
import time
from collections import defaultdict, deque
from functools import wraps

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from config import mysql

_tentativas = defaultdict(deque)
_lock = threading.Lock()


def rate_limit(limite, janela_segundos):
    """Limita requisições por IP + rota numa janela deslizante.

    Fica em memória do processo: suficiente para um servidor único. Em produção
    com vários workers, troque por Flask-Limiter com Redis. Se o app ficar atrás
    de um proxy reverso, configure o ProxyFix para que remote_addr seja o IP real.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            chave = (request.remote_addr, request.endpoint)
            agora = time.monotonic()
            with _lock:
                fila = _tentativas[chave]
                while fila and agora - fila[0] > janela_segundos:
                    fila.popleft()
                if len(fila) >= limite:
                    espera = int(janela_segundos - (agora - fila[0])) + 1
                    resposta = jsonify({"erro": f"Muitas tentativas. Tente novamente em {espera}s."})
                    resposta.status_code = 429
                    resposta.headers['Retry-After'] = str(espera)
                    return resposta
                fila.append(agora)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def usuario_atual_id():
    return int(get_jwt_identity())


def admin_required(fn):
    """Exige JWT válido e confere no banco (não no token) se o usuário é admin,
    assim remover a permissão vale imediatamente."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        cur = mysql.connection.cursor()
        cur.execute("SELECT is_admin FROM usuarios WHERE id = %s", (usuario_atual_id(),))
        linha = cur.fetchone()
        cur.close()
        if not linha or not linha[0]:
            return jsonify({"erro": "Apenas administradores podem realizar esta ação."}), 403
        return fn(*args, **kwargs)
    return wrapper
