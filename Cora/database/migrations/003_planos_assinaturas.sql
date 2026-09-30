BEGIN;

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

COMMIT;