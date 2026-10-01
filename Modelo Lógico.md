# MODELO LÓGICO

## CONTA

- **id_conta** (PK)
- nome
- email
- data_criacao

---

## PLANO

- **id_plano** (PK)
- codigo (UNIQUE)
- nome
- descricao
- preco_mensal
- demonstrativo
- ativo
- data_criacao

---

## ASSINATURA

- **id_assinatura** (PK)
- **id_conta** (FK)
- **id_plano** (FK)
- status (ativa ou cancelada)
- periodicidade (mensal)
- valor_mensal (snapshot do valor no momento da ativação)
- data_inicio
- data_fim_periodo
- data_criacao

Planos demonstrativos ativam imediatamente e não geram cobrança. A data de fim
representa o período mensal; renovação e pagamento automáticos ainda não são
implementados. Contas anteriores podem permanecer sem assinatura até escolherem
um plano no próximo acesso.

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
- tipo_pessoa (PF ou PJ)
- nome
- documento (CPF ou CNPJ; opcional e validado quando informado)
- telefone
- email
- cep
- logradouro
- numero
- complemento
- bairro
- cidade
- uf
- desconto_percentual (padrão de desconto para vendas; 0 a 100)

CPF/CNPJ é opcional, validado conforme o tipo de pessoa quando informado, e
não pode se repetir dentro da mesma conta. Os campos de endereço também são
opcionais. Limite de crédito fica pendente da implementação de vendas a prazo
e contas a receber.

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
- valor_subtotal
- desconto_percentual (percentual aplicado na venda; snapshot)
- valor_desconto
- valor_total

O desconto do cliente é apenas o padrão sugerido. A venda salva o percentual e
o valor efetivamente aplicado, que pode ser ajustado no PDV; alterações futuras
no cadastro do cliente não modificam vendas anteriores.

---

## ITEM_VENDA

- **id_item_venda** (PK)
- **id_venda** (FK)
- **id_produto** (FK)
- quantidade
- preco_venda

---

# RELACIONAMENTOS

### PLANO 1:N ASSINATURA

Um plano pode ser escolhido por várias assinaturas.

Cada assinatura referencia um único plano.

### CONTA 1:N ASSINATURA

Uma conta pode possuir histórico de assinaturas, com no máximo uma ativa.

Cada assinatura pertence a uma única conta.

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
