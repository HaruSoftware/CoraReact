BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'cliente'
          AND column_name = 'cpf'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'cliente'
          AND column_name = 'documento'
    ) THEN
        ALTER TABLE cliente RENAME COLUMN cpf TO documento;
    END IF;
END $$;

ALTER TABLE cliente
    ALTER COLUMN documento TYPE VARCHAR(14),
    ADD COLUMN IF NOT EXISTS tipo_pessoa VARCHAR(2) NOT NULL DEFAULT 'PF',
    ADD COLUMN IF NOT EXISTS cep VARCHAR(8),
    ADD COLUMN IF NOT EXISTS logradouro VARCHAR(150),
    ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
    ADD COLUMN IF NOT EXISTS complemento VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bairro VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
    ADD COLUMN IF NOT EXISTS uf CHAR(2);

UPDATE cliente
SET documento = regexp_replace(documento, '[^0-9]', '', 'g')
WHERE tipo_pessoa = 'PF';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_cliente_tipo_pessoa'
    ) THEN
        ALTER TABLE cliente
            ADD CONSTRAINT ck_cliente_tipo_pessoa CHECK (tipo_pessoa IN ('PF', 'PJ'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_cliente_conta_documento
    ON cliente (id_conta, documento);

COMMIT;