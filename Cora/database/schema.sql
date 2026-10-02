CREATE TABLE IF NOT EXISTS conta (
    id_conta SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plano (
    id_plano SERIAL PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    preco_mensal NUMERIC(10, 2) NOT NULL CHECK (preco_mensal >= 0),
    demonstrativo BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assinatura (
    id_assinatura SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    id_plano INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativa'
        CHECK (status IN ('ativa', 'cancelada')),
    periodicidade VARCHAR(20) NOT NULL DEFAULT 'mensal'
        CHECK (periodicidade = 'mensal'),
    valor_mensal NUMERIC(10, 2) NOT NULL CHECK (valor_mensal >= 0),
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim_periodo DATE NOT NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assinatura_conta
        FOREIGN KEY (id_conta) REFERENCES conta(id_conta) ON DELETE CASCADE,
    CONSTRAINT fk_assinatura_plano
        FOREIGN KEY (id_plano) REFERENCES plano(id_plano) ON DELETE RESTRICT,
    CONSTRAINT ck_assinatura_periodo
        CHECK (data_fim_periodo > data_inicio)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_assinatura_conta_ativa
    ON assinatura (id_conta)
    WHERE status = 'ativa';

INSERT INTO plano (codigo, nome, descricao, preco_mensal, demonstrativo)
VALUES
    ('essencial', 'Essencial', 'Plano mensal demonstrativo para validar a contratação.', 29.90, TRUE),
    ('profissional', 'Profissional', 'Plano mensal demonstrativo para validar a contratação.', 59.90, TRUE),
    ('avancado', 'Avançado', 'Plano mensal demonstrativo para validar a contratação.', 99.90, TRUE)
ON CONFLICT (codigo) DO NOTHING;

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
    tipo_pessoa VARCHAR(2) NOT NULL DEFAULT 'PF' CHECK (tipo_pessoa IN ('PF', 'PJ')),
    nome VARCHAR(150) NOT NULL,
    documento VARCHAR(14),
    telefone VARCHAR(20),
    email VARCHAR(150),
    cep VARCHAR(8),
    logradouro VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    desconto_percentual NUMERIC(5, 2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_cliente_conta
        FOREIGN KEY (id_conta)
        REFERENCES conta(id_conta)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_cliente_conta_documento
    ON cliente (id_conta, documento);

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

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_email_normalizado
    ON usuario (LOWER(BTRIM(email)));

CREATE TABLE IF NOT EXISTS venda (
    id_venda SERIAL PRIMARY KEY,
    id_conta INTEGER NOT NULL,
    id_cliente INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    desconto_percentual NUMERIC(5, 2) NOT NULL DEFAULT 0,
    valor_desconto DECIMAL(10, 2) NOT NULL DEFAULT 0,
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

ALTER TABLE cliente
    ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE venda
    ADD COLUMN IF NOT EXISTS valor_subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS valor_desconto DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE venda
SET valor_subtotal = valor_total
WHERE valor_subtotal = 0 AND valor_total <> 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_cliente_desconto_percentual'
    ) THEN
        ALTER TABLE cliente
            ADD CONSTRAINT ck_cliente_desconto_percentual
            CHECK (desconto_percentual BETWEEN 0 AND 100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_venda_desconto_percentual'
    ) THEN
        ALTER TABLE venda
            ADD CONSTRAINT ck_venda_desconto_percentual
            CHECK (desconto_percentual BETWEEN 0 AND 100);
    END IF;
END $$;

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
