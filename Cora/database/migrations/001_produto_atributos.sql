BEGIN;

ALTER TABLE produto
    ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(14),
    ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(50),
    ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN',
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uq_produto_codigo_barras_conta
    ON produto (id_conta, codigo_barras)
    WHERE codigo_barras IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_produto_codigo_interno_conta
    ON produto (id_conta, codigo_interno)
    WHERE codigo_interno IS NOT NULL;

COMMIT;
