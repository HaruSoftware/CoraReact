# Cora - Contexto Operacional para IA

> Guia de contexto para agentes de codigo que trabalham neste repositorio.
> A fonte de verdade e o codigo atual. O `TAP.md` descreve o escopo desejado,
> mas alguns modulos ainda existem somente no backend.

## 1. Identidade do projeto

O Cora e um sistema web de gestao empresarial e comercial multi-tenant.
Cada empresa e representada por `id_conta`. Usuarios autenticados acessam
somente dados da propria conta.

Stack principal:

- Frontend: React 19, TypeScript, Vite e React Router DOM 7.
- Backend: Node.js, Express 5 e TypeScript.
- Banco: PostgreSQL usando `pg`.
- Autenticacao: JWT em cookie HTTP-only, Bcrypt e Google OAuth/Passport.
- Estilos: CSS proprio por pagina/componente.
- Feedback: `ToastContext` com mensagens de sucesso, erro, aviso e informacao.

O frontend e o backend sao processos separados:

- Frontend Vite: porta padrao do Vite.
- API Express: `http://localhost:3000`.
- API usada pelo frontend: `http://localhost:3000/api` fixa em `src/services/api.ts`.

## 2. Estrutura do repositorio

```text
Cora/
|-- database/
|   `-- schema.sql                 Schema PostgreSQL
|-- public/                        Arquivos publicos e icones
|-- src/
|   |-- App.tsx                    Providers e rotas SPA
|   |-- App.css                    CSS legado do template Vite
|   |-- index.css                  Estilos globais
|   |-- main.tsx                   Ponto de montagem React
|   |-- assets/                    Assets do frontend
|   |-- components/
|   |   |-- Layout.tsx             Dashboard/sidebar/logout
|   |   `-- Layout.css
|   |-- config/
|   |   `-- password.ts            Estrategia Passport Google OAuth
|   |-- contexts/
|   |   |-- AuthContext.tsx         Estado e operacoes da sessao
|   |   |-- ToastContext.tsx        API global de toasts
|   |   `-- Toast.css
|   |-- pages/
|   |   |-- LoginPage.tsx/.css      Login tradicional e Google
|   |   |-- RegisterPage.tsx/.css   Cadastro de conta/admin
|   |   `-- SettingsPage.tsx/.css   Conta e usuarios
|   |-- services/
|   |   |-- api.ts                  Wrapper fetch da API
|   |   `-- auth.ts                 Operacoes de login/logout
|   `-- server/
|       |-- server.ts               Bootstrap Express e registro de rotas
|       |-- db.ts                   Pool e setup do PostgreSQL
|       |-- middleware/auth.ts      Validacao JWT e req.usuario
|       `-- routes/                 Routers REST por dominio
|-- eslint.config.js
|-- index.html
|-- package.json                    Scripts e dependencias frontend
|-- tsconfig*.json
|-- vite.config.ts
|-- README.md                       README padrao do Vite; nao e guia operacional
|-- TAP.md                          Escopo, requisitos e milestones do produto
`-- AI_CONTEXT.md                  Este guia
```

Na raiz do repositorio existe outro `package.json`, usado para dependencias de
infraestrutura do servidor (`cors`, `tsx`, tipos de Express/PG e `dotenv`).

## 3. Rotas do frontend

As rotas sao definidas em `src/App.tsx`:

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | `LoginPage` | Publico |
| `/register` | `RegisterPage` | Publico |
| `/` | `Layout`/dashboard | Autenticado |
| `/settings` | `SettingsPage` | Autenticado |
| `*` | Redireciona para `/` ou `/login` | Conforme sessao |

Os botoes de Produtos, Categorias, Clientes e Vendas aparecem na sidebar, mas
atualmente sao apenas elementos visuais. Nao ha paginas frontend para esses
modulos. Ao criar uma delas, e necessario adicionar a rota em `App.tsx`, a
navegacao em `Layout.tsx`, o componente e seu CSS.

## 4. Rotas da API

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

### CRUDs protegidos

| Dominio | Listar | Criar | Atualizar | Excluir |
| --- | --- | --- | --- | --- |
| Contas | `GET /contas/me` | `POST /contas` | `PUT /contas/me` | `DELETE /contas/me` |
| Usuarios | `GET /usuarios` | `POST /usuarios` | `PUT /usuarios/:id` | `DELETE /usuarios/:id` |
| Categorias | `GET /categorias` | `POST /categorias` | `PUT /categorias/:id` | `DELETE /categorias/:id` |
| Produtos | `GET /produtos` | `POST /produtos` | `PUT /produtos/:id` | `DELETE /produtos/:id` |
| Clientes | `GET /clientes` | `POST /clientes` | `PUT /clientes/:id` | `DELETE /clientes/:id` |
| Vendas | `GET /vendas` | `POST /vendas` | `PUT /vendas/:id` | `DELETE /vendas/:id` |
| Itens de venda | `GET /itens-venda` | `POST /itens-venda` | `PUT /itens-venda/:id` | `DELETE /itens-venda/:id` |

Endpoints de infraestrutura:

- `GET /api/health`: testa a conexao com o PostgreSQL.
- `GET /api/setup-database`: executa o schema. E publico e aparece duas vezes
  em `server.ts`; tratar isso como ponto de manutencao, nao adicionar novos
  usos sem avaliar seguranca.

## 5. Fluxos importantes

### Autenticacao

1. `LoginPage` chama `useAuth().login`.
2. `AuthContext` usa `services/auth.ts`.
3. `services/api.ts` faz `fetch` com `credentials: 'include'`.
4. O backend valida Bcrypt, cria JWT com `id_usuario` e `id_conta` e grava
   o cookie `token` por 8 horas.
5. Ao iniciar, `AuthContext` consulta `/api/auth/me`.
6. O middleware `autenticar` aceita cookie ou header Bearer, valida o JWT,
   busca o usuario e injeta `req.usuario`.

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
Campos: `nome` e `cpf` obrigatorios; `telefone` e `email` opcionais. O retorno
inclui `id_cliente`, `id_conta`, `nome`, `cpf`, `telefone` e `email`.

Para criar a interface de clientes, seguir o padrao de `SettingsPage`:
usar `api('/clientes')`, estado local para lista/formulario, confirmacao antes
de excluir e `toast` para feedback. Nao enviar `id_conta` no body.

## 6. Banco de dados

Schema em `database/schema.sql`:

| Tabela | Campos principais | Relacoes |
| --- | --- | --- |
| `conta` | `id_conta`, `nome`, `email`, `data_criacao` | Raiz do tenant |
| `usuario` | `id_usuario`, `id_conta`, `nome`, `email`, `senha`, `google_id` | Pertence a conta |
| `categoria` | `id_categoria`, `id_conta`, `nome` | Pertence a conta |
| `produto` | `id_produto`, `id_conta`, `id_categoria`, `nome`, `descricao`, `preco`, `estoque` | Conta e categoria |
| `cliente` | `id_cliente`, `id_conta`, `nome`, `cpf`, `telefone`, `email` | Pertence a conta |
| `venda` | `id_venda`, `id_conta`, `id_cliente`, `id_usuario`, `data`, `valor_total` | Conta, cliente e usuario |
| `item_venda` | `id_item_venda`, `id_venda`, `id_produto`, `quantidade`, `preco_venda` | Venda e produto |

O schema ainda nao garante automaticamente que cliente, usuario e produto
relacionados a uma venda sejam da mesma conta. Tambem nao implementa baixa de
estoque, calculo de total, historico de estoque ou indices explicitos por
`id_conta`.

## 7. O que esta pronto e o que falta

### Pronto ou parcialmente pronto

- Login, cadastro, logout e sessao por JWT.
- Cadastro de empresa e usuario administrador.
- Google OAuth com codigo presente, mas o bootstrap precisa ser revisado:
  `passport.initialize()` nao aparece em `server.ts`.
- Configuracoes da conta, CRUD de usuarios e exclusao da conta.
- CRUD backend de categorias, produtos, clientes, vendas e itens de venda.
- Toasts globais e confirmacoes de operacoes destrutivas.
- Dashboard visual, ainda com metricas fixas.

### Ainda ausente ou incompleto

- Paginas frontend de produtos, categorias, clientes e vendas/PDV.
- Metricas reais no dashboard e relatorios.
- Venda atomica com itens, totalizacao e baixa de estoque em transacao.
- Papeis/permissoes administrativas no backend.
- Convites por e-mail.
- Testes automatizados aparentes.
- `.env.example` e documentacao completa de instalacao.

Nao assumir que um endpoint pronto significa que o fluxo de usuario esta pronto.

## 8. Variaveis de ambiente

Referenciadas pelo backend:

| Variavel | Finalidade |
| --- | --- |
| `DATABASE_URL` | Connection string do PostgreSQL |
| `JWT_SECRET` | Assinatura dos JWTs |
| `FRONTEND_URL` | Origem CORS e destino do OAuth |
| `BACKEND_URL` | Callback do Google OAuth |
| `GOOGLE_CLIENT_ID` | Client ID do Google |
| `GOOGLE_CLIENT_SECRET` | Secret do Google |
| `NODE_ENV` | Configuracao de `secure`/`sameSite` do cookie |

Nao colocar segredos em codigo, commits ou neste arquivo.

## 9. Comandos

Instalar as dependencias uma vez na raiz e em `Cora/`, pois os manifests sao
separados e o servidor usa dependencias declaradas na raiz:

```bash
npm install
cd Cora
npm install
```

Depois, executar os comandos a partir de `Cora/`, salvo indicacao contraria:

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

## 10. Protocolo para implementar uma funcionalidade

1. Identificar o dominio e ler a rota backend, schema, pagina relacionada e
   contexto/servico usado pelo fluxo.
2. Preservar o padrao de nomes existente em portugues e os tipos atuais.
3. Para API protegida, aplicar `autenticar`, extrair `id_conta` do JWT e usar
   queries parametrizadas com filtro de tenant.
4. Para frontend, reutilizar `api`, `useAuth`, `useToast`, `Layout` e CSS local;
   adicionar rota e navegacao quando necessario.
5. Confirmar operacoes destrutivas e exibir feedback por toast.
6. Rodar `npm run lint` e `npm run build` dentro de `Cora/`.
7. Verificar a funcionalidade via API/UI quando a mudanca for comportamental.
8. Atualizar este arquivo quando uma rota, modulo, comando ou limitacao mudar.

## 11. Cuidados conhecidos

- Nao adicionar `id_conta` recebido do cliente em consultas de tenant.
- Nao declarar um modulo como completo apenas porque seu router existe.
- Nao mover dependencias entre os dois `package.json` sem verificar de onde o
  processo realmente esta sendo iniciado.
- Nao expor credenciais ou assumir que o endpoint de setup deve ficar publico
  em producao.
- Exclusoes de conta, usuario, categoria, produto e cliente devem considerar
  chaves estrangeiras e o impacto em vendas relacionadas.
- O backend atualmente nao distingue administrador de colaborador.

## 12. Documentos de referencia

- `TAP.md`: objetivos, requisitos funcionais, riscos e milestones.
- `database/schema.sql`: fonte da estrutura relacional.
- `src/server/server.ts`: bootstrap e mapa de routers.
- `src/server/middleware/auth.ts`: contrato de autenticacao.
- `src/services/api.ts`: contrato de chamadas frontend para a API.