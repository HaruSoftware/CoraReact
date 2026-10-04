erDiagram
    conta {
        SERIAL id_conta PK
        VARCHAR_150 nome
        VARCHAR_150 email "UNIQUE"
        INTEGER id_usuario_criador FK
        TIMESTAMP data_criacao "DEFAULT NOW"
    }
    plano {
        SERIAL id_plano PK
        VARCHAR_40 codigo "UNIQUE"
        VARCHAR_100 nome
        TEXT descricao
        NUMERIC_10_2 preco_mensal "CHECK >= 0"
        BOOLEAN demonstrativo "DEFAULT FALSE"
        BOOLEAN ativo "DEFAULT TRUE"
        TIMESTAMP data_criacao "DEFAULT NOW"
    }
    assinatura {
        SERIAL id_assinatura PK
        INTEGER id_conta FK
        INTEGER id_plano FK
        VARCHAR_20 status "DEFAULT ativa"
        VARCHAR_20 periodicidade "DEFAULT mensal"
        NUMERIC_10_2 valor_mensal "CHECK >= 0"
        DATE data_inicio "DEFAULT TODAY"
        DATE data_fim_periodo
        TIMESTAMP data_criacao "DEFAULT NOW"
    }
    usuario {
        SERIAL id_usuario PK
        INTEGER id_conta FK
        VARCHAR_150 nome
        VARCHAR_150 email "UNIQUE"
        VARCHAR_255 senha_hash "NULL"
        VARCHAR_100 google_id "NULL UNIQUE"
        VARCHAR_20 papel "DEFAULT colaborador"
        BOOLEAN ativo "DEFAULT TRUE"
        TIMESTAMP data_criacao "DEFAULT NOW"
    }
    categoria {
        SERIAL id_categoria PK
        INTEGER id_conta FK
        VARCHAR_100 nome
    }
    unidade_medida {
        SERIAL id_unidade_medida PK
        INTEGER id_conta FK
        VARCHAR_20 codigo
        VARCHAR_60 nome
        BOOLEAN ativo "DEFAULT TRUE"
        TIMESTAMP data_cadastro "DEFAULT NOW"
    }
    produto {
        SERIAL id_produto PK
        INTEGER id_conta FK
        INTEGER id_categoria FK
        VARCHAR_150 nome
        TEXT descricao "NULL"
        VARCHAR_50 codigo_barras "NULL"
        VARCHAR_50 codigo_interno "NULL"
        NUMERIC_10_2 custo "DEFAULT 0 CHECK >= 0"
        NUMERIC_10_2 preco "CHECK > 0"
        INTEGER estoque "DEFAULT 0"
        INTEGER estoque_minimo "DEFAULT 0"
        VARCHAR_20 unidade_medida
        BOOLEAN ativo "DEFAULT TRUE"
        TIMESTAMP data_cadastro "DEFAULT NOW"
        TIMESTAMP data_atualizacao "DEFAULT NOW"
    }
    cliente {
        SERIAL id_cliente PK
        INTEGER id_conta FK
        CHAR_2 tipo_pessoa "PF ou PJ"
        VARCHAR_150 nome
        VARCHAR_20 documento "NULL"
        VARCHAR_20 telefone "NULL"
        VARCHAR_150 email "NULL"
        VARCHAR_10 cep "NULL"
        VARCHAR_200 logradouro "NULL"
        VARCHAR_20 numero "NULL"
        VARCHAR_100 complemento "NULL"
        VARCHAR_100 bairro "NULL"
        VARCHAR_100 cidade "NULL"
        CHAR_2 uf "NULL"
        NUMERIC_5_2 desconto_p "DEFAULT 0"
    }
    venda {
        SERIAL id_venda PK
        INTEGER id_conta FK
        INTEGER id_cliente FK
        INTEGER id_usuario FK
        VARCHAR_20 status "DEFAULT concluida"
        NUMERIC_12_2 valor_total "DEFAULT 0"
        TIMESTAMP data_venda "DEFAULT NOW"
    }
    item_venda {
        SERIAL id_item_venda PK
        INTEGER id_venda FK
        INTEGER id_produto FK
        INTEGER quantidade "CHECK > 0"
        NUMERIC_10_2 preco_unitario "snapshot"
        NUMERIC_12_2 subtotal "qtd x preco"
    }

    conta ||--o{ assinatura : "id_conta"
    plano ||--o{ assinatura : "id_plano"
    conta ||--o{ usuario : "id_conta"
    conta ||--o{ categoria : "id_conta"
    conta ||--o{ unidade_medida : "id_conta"
    conta ||--o{ produto : "id_conta"
    conta ||--o{ cliente : "id_conta"
    conta ||--o{ venda : "id_conta"
    categoria ||--o{ produto : "id_categoria"
    cliente ||--o{ venda : "id_cliente"
    usuario ||--o{ venda : "id_usuario"
    venda ||--|{ item_venda : "id_venda"
    produto ||--o{ item_venda : "id_produto"
