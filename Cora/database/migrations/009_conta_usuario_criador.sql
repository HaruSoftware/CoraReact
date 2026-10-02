BEGIN;

SELECT pg_advisory_xact_lock(9009009);

ALTER TABLE conta
    ADD COLUMN IF NOT EXISTS id_usuario_criador INTEGER;

UPDATE conta
SET id_usuario_criador = (
    SELECT MIN(usuario.id_usuario)
    FROM usuario
    WHERE usuario.id_conta = conta.id_conta
)
WHERE id_usuario_criador IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_conta_usuario_criador'
          AND conrelid = 'conta'::regclass
    ) THEN
        ALTER TABLE conta
            ADD CONSTRAINT fk_conta_usuario_criador
            FOREIGN KEY (id_usuario_criador)
            REFERENCES usuario(id_usuario)
            ON DELETE NO ACTION
            DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

COMMIT;
