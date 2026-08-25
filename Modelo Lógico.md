MODELO LÓGICO

PRODUTO

id_produto (PK)
nome
descricao
preco
estoque
id_categoria (FK)

CATEGORIA

id_categoria (PK)
nome

CLIENTE

id_cliente (PK)
nome
cpf
telefone
email

USUARIO

id_usuario (PK)
nome
email
senha

VENDA

id_venda (PK)
id_cliente (FK)
id_usuario (FK)
data
valor_total

ITEM_VENDA

id_item_venda (PK)
id_venda (FK)
id_produto (FK)
quantidade
preco_venda
Relacionamentos
CATEGORIA 1:N PRODUTO
Uma categoria possui vários produtos.
Um produto pertence a uma categoria.
CLIENTE 1:N VENDA
Um cliente pode realizar várias vendas.
Cada venda pertence a um cliente.
USUARIO 1:N VENDA
Um usuário pode realizar várias vendas.
Cada venda é realizada por um usuário.
VENDA 1:N ITEM_VENDA
Uma venda possui vários itens.
Cada item pertence a uma venda.
PRODUTO 1:N ITEM_VENDA
Um produto pode aparecer em vários itens de venda.
Cada item de venda refere-se a um produto.
