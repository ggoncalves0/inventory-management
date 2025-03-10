from flask import Flask
from config import app
from routes.products import produtos_bp

app.register_blueprint(produtos_bp)

if __name__ == '__main__':
    app.run(debug=True)
