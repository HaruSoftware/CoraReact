BEGIN;

DO $$
DECLARE
    conflitos TEXT;
BEGIN
    SELECT string_agg(
        format('%s: usuários %s', email_normalizado, ids_usuario),
        '; '
    )
    INTO conflitos
    FROM (
        SELECT
            LOWER(BTRIM(email)) AS email_normalizado,
            string_agg(id_usuario::TEXT, ', ' ORDER BY id_usuario) AS ids_usuario
        FROM usuario
        GROUP BY LOWER(BTRIM(email))
        HAVING COUNT(*) > 1
    ) AS duplicados;

    IF conflitos IS NOT NULL THEN
        RAISE EXCEPTION 'Não foi possível aplicar a unicidade de e-mail em usuario.'
            USING DETAIL = conflitos,
                  HINT = 'Resolva manualmente os usuários duplicados e execute novamente a migração.';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_email_normalizado
    ON usuario (LOWER(BTRIM(email)));

COMMIT;