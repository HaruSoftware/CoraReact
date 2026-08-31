CREATE TABLE conta (
    id_conta SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,

    CONSTRAINT fk_categoria_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE
);

CREATE TABLE produto (
    id_produto SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    id_categoria INTEGER NOT NULL,

    CONSTRAINT fk_produto_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE,

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria)
        ON DELETE CASCADE
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(150),

    CONSTRAINT fk_cliente_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,

    CONSTRAINT fk_usuario_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE
);

CREATE TABLE venda (
    id_venda SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    id_cliente INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10, 2) NOT NULL,

    CONSTRAINT fk_venda_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE,

    CONSTRAINT fk_venda_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente),

    CONSTRAINT fk_venda_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

CREATE TABLE item_venda (
    id_item_venda SERIAL PRIMARY KEY,
    id_venda INTEGER NOT NULL,
    id_produto INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_venda DECIMAL(10, 2) NOT NULL,

    CONSTRAINT fk_item_venda_venda
        FOREIGN KEY (id_venda)
        REFERENCES venda(id_venda)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_venda_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto(id_produto)
);
