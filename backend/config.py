from flask import Flask
from flask_mysqldb import MySQL
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CORS(app, supports_credentials=True, resources={r"/.*": {"origins": os.getenv("FRONTEND_URL")}})

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
mysql = MySQL(app)
jwt = JWTManager(app)
