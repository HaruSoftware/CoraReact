# Cora - Instrucoes e Contexto para IAs

> Fonte de verdade: o codigo atual. `TAP.md` descreve o produto desejado e
> pode estar adiantado em relacao ao que ja foi implementado.
>
> Compatibilidade: este arquivo pode ser lido manualmente por qualquer IA,
> mas a descoberta automatica varia. Muitos agentes procuram `AGENTS.md`,
> enquanto o GitHub Copilot costuma usar `.github/copilot-instructions.md`.

## Regras operacionais

- Antes de editar, localize o componente, rota, servico ou tabela que realmente
  controla o comportamento pedido.
- Preserve os padroes existentes: TypeScript, nomes em portugues, CSS local,
  `api`, `useAuth`, `useToast` e componentes atuais.
- Em toda API protegida, use `autenticar`, extraia `id_conta` de
  `req.usuario!.id_conta` e ignore qualquer `id_conta` enviado pelo cliente.
- Use SQL parametrizado e filtre por `id_conta` em leituras, alteracoes e
  exclusoes. Valide tambem o tenant de registros relacionados.
- Nao trate um router backend como funcionalidade concluida: confira a UI,
  validacao, autorizacao e o fluxo completo.
- Confirme operacoes destrutivas e use `ToastContext` para feedback na UI.
- Apos editar, rode `npm run lint` e `npm run build` dentro de `Cora/`; para
  mudancas de comportamento, valide tambem a API ou a interface.
- Nao exponha segredos, nao introduza dependencias sem necessidade e nao faca
  refatoracoes fora do escopo.

## Visao rapida

O Cora e um sistema web de gestao empresarial multi-tenant. Cada empresa e
representada por `id_conta`; usuarios autenticados devem acessar apenas dados
da propria conta.

- Frontend: React 19, TypeScript, Vite, React Router DOM 7 e CSS proprio.
- Backend: Node.js, Express 5, TypeScript e PostgreSQL (`pg`).
- Sessao: JWT em cookie HTTP-only, Bcrypt e Google OAuth/Passport.
- Feedback: `ToastContext` com toasts de sucesso, erro, aviso e informacao.
- API: `http://localhost:3000/api`, fixa em `src/services/api.ts`.
- Frontend e API rodam como processos separados.

## Estrutura do repositorio

- `database/schema.sql`: schema PostgreSQL.
- `src/App.tsx`, `main.tsx`, `index.css`: entrada, providers e rotas SPA.
- `src/pages/`: login, cadastro e configuracoes; cada tela tem CSS local.
- `src/components/Layout.tsx`: dashboard, sidebar e logout.
- `src/contexts/`: sessao (`AuthContext`) e toasts (`ToastContext`).
- `src/services/`: wrapper `api.ts` e operacoes de autenticacao.
- `src/server/`: bootstrap Express, banco, middleware JWT e routers REST.
- `src/config/password.ts`: estrategia Passport Google OAuth.
- `TAP.md`: escopo planejado; `agents.md`: este contexto.

Existem dois manifests: `Cora/package.json` concentra a aplicacao; o da raiz
fornece dependencias usadas pelo servidor, como `cors`, `tsx`, tipos de
Express/PG e `dotenv`.

## Rotas do frontend

As rotas sao definidas em `src/App.tsx`:

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | `LoginPage` | Publico |
| `/register` | `RegisterPage` | Publico |
| `/escolher-plano` | `PlanSelectionPage` | Autenticado sem assinatura ativa |
| `/` | `Layout`/dashboard | Autenticado |
| `/settings` | `SettingsPage` | Autenticado |
| `*` | Redireciona para `/` ou `/login` | Conforme sessao |

Produtos, Categorias, Clientes e Vendas aparecem na sidebar, mas ainda nao tem
paginas frontend. Ao criar uma, adicione rota em `App.tsx`, navegacao em
`Layout.tsx`, componente e CSS local.

## Rotas da API

Todas as rotas abaixo usam o prefixo `/api`.

### Autenticacao e sessao

| Metodo | Endpoint | Protecao |
| --- | --- | --- |
| POST | `/auth/login` | Publico |
| POST | `/auth/register` | Publico |
| POST | `/auth/logout` | Publico |
| GET | `/auth/me` | JWT |
| GET | `/auth/google` | Google OAuth |
| GET | `/auth/google/callback` | Google OAuth |
| GET | `/planos` | Publico |
| GET | `/assinaturas/me` | JWT |
| POST | `/assinaturas` | JWT, conta sem plano ativo |

### CRUDs protegidos

`contas`: `GET/PUT/DELETE /contas/me`, `POST /contas`.

`usuarios`, `categorias`, `produtos` e `clientes` mantêm CRUD protegido.

`vendas`: `GET /vendas` lista o histórico, `GET /vendas/:id` mostra os itens e
`POST /vendas` registra venda, itens, subtotal, desconto aplicado, total
calculado e baixa de estoque em uma transação. O desconto percentual do cliente
é o padrão; o POST aceita override e salva o percentual/valor na venda. Vendas
não podem ser alteradas/excluídas pelas rotas gerais.

`itens-venda`: apenas `GET` é permitido; itens são escritos exclusivamente
pela transação de criação da venda.

Todos exigem JWT, exceto os endpoints de autenticacao indicados acima.

Endpoints de infraestrutura:

- `GET /api/health`: testa a conexao com o PostgreSQL.
- `GET /api/setup-database`: executa o schema. E publico e aparece duas vezes
  em `server.ts`; tratar isso como ponto de manutencao, nao adicionar novos
  usos sem avaliar seguranca.

## Fluxos importantes

### Autenticacao

1. `LoginPage` -> `AuthContext` -> `services/auth.ts` -> `api.ts`.
2. `api.ts` usa `credentials: 'include'`; o backend valida Bcrypt, cria JWT
  com `id_usuario`/`id_conta` e grava o cookie `token` por 8 horas.
3. No inicio, `AuthContext` chama `/api/auth/me`. `autenticar` aceita cookie
  ou Bearer, valida o token, busca o usuario e injeta `req.usuario`.
4. O cadastro exige `id_plano` e cria conta, usuario e assinatura mensal ativa
  na mesma transacao. O primeiro cadastro Google recebe o plano selecionado
  por cookie temporario; contas antigas sem assinatura vao para
  `/escolher-plano` no proximo acesso.

### Multi-tenancy

Em toda rota protegida:

1. Obter `id_conta` de `req.usuario!.id_conta` apos `autenticar`.
2. Nunca confiar em `id_conta` enviado pelo frontend.
3. Usar SQL parametrizado (`$1`, `$2`, etc.).
4. Filtrar leitura, alteracao e exclusao por `id_conta`.
5. Ao relacionar registros, validar que todos pertencem a mesma conta.

O `item_venda` nao possui `id_conta`; seu isolamento depende da venda. Nao
alterar esse comportamento sem revisar o schema e todas as queries relacionadas.

### Clientes

O backend esta em `src/server/routes/clientes.ts` e oferece CRUD protegido.
Campos: `tipo_pessoa` (PF/PJ), `nome` e `documento` (CPF/CNPJ) obrigatorios;
`telefone`, `email` e endereco (`cep`, `logradouro`, `numero`, `complemento`,
`bairro`, `cidade`, `uf`) opcionais. CPF/CNPJ e validado e nao pode se repetir
dentro da mesma conta. `desconto_percentual` e opcional (padrao zero, faixa 0 a
100). O retorno inclui o desconto cadastrado, aplicado como sugestao em cada
venda. Schema e migration 005 mantem clientes existentes como PF.

Para criar a interface de clientes, seguir o padrao de `SettingsPage`:
usar `api('/clientes')`, estado local para lista/formulario, confirmacao antes
de excluir e `toast` para feedback. Nao enviar `id_conta` no body.

## Banco de dados

Schema em `database/schema.sql`: `conta` e a raiz; `usuario`, `categoria`,
`produto` e `cliente` pertencem a uma conta; `venda` pertence a conta e
referencia cliente/usuario; `item_venda` referencia venda/produto.

`plano` guarda o catalogo mensal; `assinatura` relaciona conta e plano,
mantem o valor contratado e o periodo mensal. Os planos iniciais sao
demonstrativos: nao ha pagamento ou renovacao automatica. Contas existentes
nao recebem plano na migracao.

Campos centrais: `produto` tem `preco`/`estoque`; `cliente` tem `tipo_pessoa`,
`nome`, `documento`, endereco, `telefone`, `email` e `desconto_percentual`;
`venda` guarda `valor_subtotal`,
`desconto_percentual`, `valor_desconto` e `valor_total`; `item_venda` guarda
`quantidade`/`preco_venda`.

O schema não garante todos os relacionamentos entre tenants por chaves
compostas; as rotas de venda validam conta, cliente e produtos e aplicam
estoque/valores na mesma transação. Cancelamento e estorno de vendas ainda não
estão implementados.

## Estado atual

### Implementado

- Login, cadastro, logout e sessao por JWT.
- Cadastro de empresa e usuario administrador.
- Catalogo demonstrativo de planos mensais e ativacao de assinatura no cadastro.
- Onboarding de plano para contas sem assinatura e consulta em Configuracoes.
- Configuracoes da conta, CRUD de usuarios e exclusao da conta.
- CRUD backend de categorias, produtos e clientes; vendas transacionais com
  histórico, detalhe e baixa de estoque.
- Toasts globais e confirmacoes de operacoes destrutivas.

### Parcial ou ausente

- Paginas frontend de produtos, categorias, clientes e vendas/PDV.
- Dashboard com metricas reais e relatorios.
- Venda atomica com itens, totalizacao e baixa de estoque em transacao.
- Papeis/permissoes administrativas no backend.
- Convites por e-mail.
- Testes automatizados aparentes.
- `.env.example` e documentacao completa de instalacao.
- Google OAuth: o codigo existe, mas `passport.initialize()` nao aparece em
  `server.ts` e precisa ser verificado antes de tratar o fluxo como funcional.

Nao assumir que um endpoint pronto significa que o fluxo de usuario esta pronto.

## Variaveis de ambiente

Backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `BACKEND_URL`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `NODE_ENV` (cookie
`secure`/`sameSite`). Nunca coloque segredos no codigo ou neste arquivo.

## Comandos e validacao

Instalar as dependencias uma vez na raiz e em `Cora/`, pois os manifests sao
separados e o servidor usa dependencias declaradas na raiz:

```bash
npm install
cd Cora
npm install
```

Depois, executar a partir de `Cora/`:

```bash
npm run dev       # frontend Vite
npm run server    # API Express em http://localhost:3000
npm run build     # tsc -b e vite build
npm run lint      # ESLint
npm run preview   # preview do build Vite
```

Frontend e API precisam estar rodando simultaneamente para testar os fluxos
completos. Antes de testar autenticacao ou CRUD, confirme PostgreSQL,
`DATABASE_URL`, `JWT_SECRET` e CORS.

## Fluxo de trabalho recomendado

1. Identifique o dominio e leia sua rota, schema, pagina, contexto e servico.
2. Se for frontend, adicione a rota em `App.tsx`, a navegacao em `Layout.tsx`,
   a pagina e o CSS local quando aplicavel.
3. Se for backend, registre o router em `server.ts`, proteja-o e aplique as
   regras de tenant acima.
4. Considere validacao, autorizacao, chaves estrangeiras e estados de erro.
5. Instale dependencias se necessario; rode lint/build em `Cora/`.
6. Valide API/UI quando a mudanca for comportamental e atualize este arquivo
   se houver nova rota, comando, modulo ou limitacao.

## Riscos e limites conhecidos

- `item_venda` nao possui `id_conta`; o isolamento depende da venda.
- O schema nao garante que cliente, usuario e produto de uma venda sejam do
  mesmo tenant, nem implementa estoque automatico, totalizacao ou historico.
- O backend nao distingue administrador de colaborador.
- `GET /api/setup-database` e publico e aparece duas vezes em `server.ts`;
  nao reutilizar esse padrao em producao.
- Exclusoes devem considerar chaves estrangeiras e vendas relacionadas.

## Referencias

- `TAP.md`: objetivos, requisitos funcionais, riscos e milestones.
- `database/schema.sql`: fonte da estrutura relacional.
- `src/server/server.ts`: bootstrap e mapa de routers.
- `src/server/middleware/auth.ts`: contrato de autenticacao.
- `src/services/api.ts`: contrato de chamadas frontend para a API.