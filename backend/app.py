import os

from flask import jsonify
from werkzeug.exceptions import HTTPException

from config import app, jwt
from routes.auth import auth_bp
from routes.products import produtos_bp

app.register_blueprint(produtos_bp)
app.register_blueprint(auth_bp)


@app.after_request
def headers_de_seguranca(resposta):
    resposta.headers['X-Content-Type-Options'] = 'nosniff'
    resposta.headers['X-Frame-Options'] = 'DENY'
    resposta.headers['Referrer-Policy'] = 'no-referrer'
    resposta.headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'"
    resposta.headers['Cache-Control'] = 'no-store'
    return resposta


# ---------- Erros do JWT em JSON e em português ----------
@jwt.unauthorized_loader
def _sem_token(_motivo):
    return jsonify({"erro": "Autenticação necessária"}), 401


@jwt.invalid_token_loader
def _token_invalido(_motivo):
    return jsonify({"erro": "Sessão inválida, faça login novamente"}), 401


@jwt.expired_token_loader
def _token_expirado(_header, _payload):
    return jsonify({"erro": "Sessão expirada, faça login novamente"}), 401


# ---------- Erros genéricos (sem vazar stack trace) ----------
MENSAGENS_HTTP = {
    400: "Requisição inválida",
    404: "Rota não encontrada",
    405: "Método não permitido",
    413: "Requisição grande demais",
}


@app.errorhandler(HTTPException)
def _erro_http(e):
    return jsonify({"erro": MENSAGENS_HTTP.get(e.code, e.name)}), e.code


@app.errorhandler(Exception)
def _erro_interno(e):
    app.logger.exception(e)
    return jsonify({"erro": "Erro interno do servidor"}), 500


if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG') == '1')
