# MODELO LÓGICO

## CONTA

- **id_conta** (PK)
- nome
- email
- data_criacao

---

## PRODUTO

- **id_produto** (PK)
- **id_conta** (FK)
- **id_categoria** (FK)
- nome
- descricao
- codigo_barras (opcional)
- codigo_interno (opcional)
- preco
- estoque
- estoque_minimo
- unidade_medida
- ativo
- data_cadastro
- data_atualizacao

---

## CATEGORIA

- **id_categoria** (PK)
- **id_conta** (FK)
- nome

---

## UNIDADE_MEDIDA

- **id_unidade_medida** (PK)
- **id_conta** (FK)
- codigo
- nome
- ativo
- data_cadastro

---

## CLIENTE

- **id_cliente** (PK)
- **id_conta** (FK)
- nome
- cpf
- telefone
- email

---

## USUARIO

- **id_usuario** (PK)
- **id_conta** (FK)
- nome
- email
- senha (opcional para usuarios google)
- google_id (UNIQUE, OPCIONAL)

---

## VENDA

- **id_venda** (PK)
- **id_conta** (FK)
- **id_cliente** (FK)
- **id_usuario** (FK)
- data
- valor_total

---

## ITEM_VENDA

- **id_item_venda** (PK)
- **id_venda** (FK)
- **id_produto** (FK)
- quantidade
- preco_venda

---

# RELACIONAMENTOS

### CONTA 1:N USUARIO

Uma conta possui vários usuários.

Cada usuário pertence a uma única conta.

### CONTA 1:N PRODUTO

Uma conta possui vários produtos.

Cada produto pertence a uma única conta.

### CONTA 1:N CATEGORIA

Uma conta possui várias categorias.

Cada categoria pertence a uma única conta.

### CONTA 1:N UNIDADE_MEDIDA

Uma conta possui várias unidades de medida configuráveis.

Cada unidade de medida pertence a uma única conta.

### CONTA 1:N CLIENTE

Uma conta possui vários clientes.

Cada cliente pertence a uma única conta.

### CONTA 1:N VENDA

Uma conta possui várias vendas.

Cada venda pertence a uma única conta.

### CATEGORIA 1:N PRODUTO

Uma categoria possui vários produtos.

Cada produto pertence a uma categoria.

### CLIENTE 1:N VENDA

Um cliente pode realizar várias vendas.

Cada venda pertence a um cliente.

### USUARIO 1:N VENDA

Um usuário pode realizar várias vendas.

Cada venda é realizada por um usuário.

### VENDA 1:N ITEM_VENDA

Uma venda possui vários itens.

Cada item pertence a uma venda.

### PRODUTO 1:N ITEM_VENDA

Um produto pode aparecer em vários itens de venda.

Cada item de venda refere-se a um produto.
