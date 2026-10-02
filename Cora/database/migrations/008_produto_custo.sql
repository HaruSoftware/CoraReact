BEGIN;

ALTER TABLE produto
    ADD COLUMN IF NOT EXISTS custo NUMERIC(10, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_produto_custo' AND conrelid = 'produto'::regclass
    ) THEN
        ALTER TABLE produto
            ADD CONSTRAINT ck_produto_custo CHECK (custo >= 0);
    END IF;
END $$;

COMMIT;