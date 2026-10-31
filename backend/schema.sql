-- Cria o banco e as tabelas usadas pelo backend.
-- Rodar com: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS inventory_db
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade >= 0),
    preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------------
-- MIGRAÇÃO: se você já tinha o banco criado pela versão anterior,
-- rode apenas os comandos abaixo (uma vez) em vez do script inteiro:
--
--   USE inventory_db;
--   ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
--   UPDATE usuarios SET is_admin = TRUE WHERE id = 1;
-- ------------------------------------------------------------------
