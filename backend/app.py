import os
from datetime import datetime, timezone

from flask import jsonify
from flask_jwt_extended import create_access_token, get_jwt
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


@app.after_request
def renovar_sessao(resposta):
    """Sessão deslizante: quem está usando o app não é derrubado no meio do trabalho.

    Se o token da requisição já passou da metade da validade, devolve um novo no header
    X-Novo-Token (o frontend troca o salvo). Uma sessão parada continua expirando em
    JWT_ACCESS_TOKEN_EXPIRES, e nenhuma passa de JWT_SESSAO_MAXIMA desde o login: o novo
    token carrega o início da sessão e nunca vence depois desse teto.
    """
    if resposta.status_code == 401:
        return resposta
    try:
        dados = get_jwt()
    except RuntimeError:
        return resposta  # rota sem autenticação (login, cadastro)
    if not dados:
        return resposta

    validade = app.config['JWT_ACCESS_TOKEN_EXPIRES']
    agora = datetime.now(timezone.utc)
    vence_em = datetime.fromtimestamp(dados['exp'], timezone.utc)
    inicio = datetime.fromtimestamp(dados.get('inicio_sessao', dados['iat']), timezone.utc)
    fim_da_sessao = inicio + app.config['JWT_SESSAO_MAXIMA']

    if vence_em - agora > validade / 2 or agora >= fim_da_sessao:
        return resposta

    resposta.headers['X-Novo-Token'] = create_access_token(
        identity=dados['sub'],
        additional_claims={'inicio_sessao': int(inicio.timestamp())},
        expires_delta=min(validade, fim_da_sessao - agora),
    )
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
