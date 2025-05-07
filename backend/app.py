from flask import Flask
from flask_jwt_extended import JWTManager
from config import app, jwt
from routes.products import produtos_bp
from routes.auth import auth_bp

jwt.init_app(app)

app.register_blueprint(produtos_bp)
app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(debug=True)
