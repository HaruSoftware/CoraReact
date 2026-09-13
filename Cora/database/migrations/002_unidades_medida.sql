BEGIN;

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

INSERT INTO unidade_medida (id_conta, codigo, nome)
SELECT conta.id_conta, unidade.codigo, unidade.nome
FROM conta
CROSS JOIN (VALUES
    ('UN', 'Unidade'),
    ('KG', 'Quilograma'),
    ('G', 'Grama'),
    ('L', 'Litro'),
    ('ML', 'Mililitro')
) AS unidade(codigo, nome)
ON CONFLICT (id_conta, codigo) DO NOTHING;

COMMIT;