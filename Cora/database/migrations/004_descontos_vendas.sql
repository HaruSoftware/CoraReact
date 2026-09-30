BEGIN;

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

COMMIT;