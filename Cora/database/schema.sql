CREATE TABLE IF NOT EXISTS conta (
    id_conta SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,

    CONSTRAINT fk_categoria_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS unidade_medida (
    id_unidade_medida SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    nome VARCHAR(80) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_unidade_medida_conta_codigo UNIQUE (id_conta, codigo),
    CONSTRAINT fk_unidade_medida_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS produto (
    id_produto SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    id_categoria INTEGER NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    codigo_barras VARCHAR(14),
    codigo_interno VARCHAR(50),
    preco DECIMAL(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 0,
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_produto_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE,

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria)
        ON DELETE CASCADE
);

ALTER TABLE produto ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(14);
ALTER TABLE produto ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(50);
ALTER TABLE produto ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE produto ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN';
ALTER TABLE produto ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE produto ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE produto ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uq_produto_codigo_barras_conta
    ON produto (id_conta, codigo_barras)
    WHERE codigo_barras IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_produto_codigo_interno_conta
    ON produto (id_conta, codigo_interno)
    WHERE codigo_interno IS NOT NULL;

CREATE TABLE IF NOT EXISTS cliente (
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

CREATE TABLE IF NOT EXISTS usuario (
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

CREATE TABLE IF NOT EXISTS venda (
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

CREATE TABLE IF NOT EXISTS item_venda (
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
