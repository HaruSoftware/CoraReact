erDiagram
    CONTA {
        int id_conta PK
        string nome
        string email
        date data_criacao
    }
    USUARIO {
        int id_usuario PK
        int id_conta FK
        string nome
        string email
        string senha_hash
        string google_id
        string papel
        bool ativo
        date data_criacao
    }
    PLANO {
        int id_plano PK
        string codigo
        string nome
        text descricao
        decimal preco_mensal
        bool demonstrativo
        bool ativo
        date data_criacao
    }
    ASSINATURA {
        int id_assinatura PK
        int id_conta FK
        int id_plano FK
        string status
        string periodicidade
        decimal valor_mensal
        date data_inicio
        date data_fim_periodo
        date data_criacao
    }
    CATEGORIA {
        int id_categoria PK
        int id_conta FK
        string nome
    }
    UNIDADE_MEDIDA {
        int id_unidade_medida PK
        int id_conta FK
        string codigo
        string nome
        bool ativo
        date data_cadastro
    }
    PRODUTO {
        int id_produto PK
        int id_conta FK
        int id_categoria FK
        string nome
        text descricao
        string codigo_barras
        string codigo_interno
        decimal custo
        decimal preco
        int estoque
        int estoque_minimo
        string unidade_medida
        bool ativo
        date data_cadastro
        date data_atualizacao
    }
    CLIENTE {
        int id_cliente PK
        int id_conta FK
        string tipo_pessoa
        string nome
        string documento
        string telefone
        string email
        string cep
        string logradouro
        string numero
        string complemento
        string bairro
        string cidade
        string uf
        decimal desconto_p
    }
    VENDA {
        int id_venda PK
        int id_conta FK
        int id_cliente FK
        int id_usuario FK
        string status
        decimal valor_total
        date data_venda
    }
    ITEM_VENDA {
        int id_item_venda PK
        int id_venda FK
        int id_produto FK
        int quantidade
        decimal preco_unitario
        decimal subtotal
    }

    CONTA ||--o{ USUARIO : "possui"
    CONTA ||--o{ ASSINATURA : "contrata"
    CONTA ||--o{ CATEGORIA : "define"
    CONTA ||--o{ UNIDADE_MEDIDA : "define"
    CONTA ||--o{ PRODUTO : "cadastra"
    CONTA ||--o{ CLIENTE : "gerencia"
    CONTA ||--o{ VENDA : "realiza"
    PLANO ||--o{ ASSINATURA : "associado a"
    CATEGORIA ||--o{ PRODUTO : "classifica"
    CLIENTE ||--o{ VENDA : "participa de"
    USUARIO ||--o{ VENDA : "opera"
    VENDA ||--|{ ITEM_VENDA : "contem"
    PRODUTO ||--o{ ITEM_VENDA : "compoe"
