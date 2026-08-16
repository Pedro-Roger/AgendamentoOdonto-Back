# Administração Cross-Tenant (Superadmin) — Design

**Data:** 2026-08-16
**Autor:** Pedro (pedronisashi@gmail.com) + Claude
**Status:** Proposto — aguardando decisão de Pedro nos pontos listados em "Perguntas em aberto"

---

## 1. Contexto

Em 2026-08-16 foi implementada a decisão **(A)**: cada usuário cadastrado com papel `DENTISTA`
deixa de herdar a Compania de quem o criou e ganha uma Compania (`Tenant`) própria, entrando
nela como `MASTER` (`src/users/users.service.ts`, método `create`). Isso resolveu o vazamento de
agenda entre dentistas, mas criou uma consequência aceita e ainda não resolvida: **depois de
criado, o dentista some da administração de quem o cadastrou.** `UsersController.list`
(`src/users/users.controller.ts`) filtra por `tenantId` do usuário logado, e cada Compania só
enxerga a si mesma — não existe hoje nenhuma tela ou papel que veja todas as Companias de uma vez.

Esta spec cobre a feature que resolve isso: uma camada de administração cross-tenant, usada pela
Zarko (Pedro), não pelos clientes.

## 2. Problema

Não existe hoje nenhuma forma de:
- Ver quantas Companias existem no sistema, quantos usuários/pacientes/consultas cada uma tem.
- Criar uma Compania manualmente (fora do fluxo automático de cadastro de dentista).
- Desativar uma Compania — o campo `Tenant.isActive` existe no schema (`prisma/schema.prisma`)
  mas **nada no código lê esse campo** (confirmado por busca no repositório: a única leitura de
  `isActive` em `AuthService.login` é `user.isActive`, nunca `tenant.isActive` — ver §3). Ou seja,
  hoje desativar uma Compania não teria nenhum efeito.
- Entrar numa Compania para dar suporte a um cliente.

Achado adicional, não pedido mas relevante para esta spec porque usa o mesmo mecanismo de
permissão: **`GET/POST /api/tenants` já existe** (`src/tenants/tenants.controller.ts`) e já lista
**todas** as Companias sem nenhum filtro (`TenantsService.list()` → `this.repo.list()` →
`prisma.tenant.findMany()`, sem `where`). Está protegido só por `@Roles('MASTER')`. Como, desde a
decisão (A), **todo dentista é `MASTER` da própria Compania**, isso significa que **qualquer
dentista cadastrado no sistema hoje já consegue chamar essa rota e ver nome/slug/status de todas
as Companias de todos os outros clientes**. Não é o vazamento de dado clínico que motivou o
redesign de junho, mas é vazamento de dado de negócio (quem mais usa o sistema) e usa exatamente o
mesmo mecanismo (`@Roles`) que esta feature precisa corrigir. Ver Slice 0.

## 3. Objetivo

Dar à Zarko um papel de administração que enxerga todas as Companias, com métricas agregadas,
consegue criar/ativar/desativar Companias, e consegue entrar numa Compania para dar suporte —
sem que isso vire uma porta de acesso permanente ou despercebida a dado clínico de paciente real.

---

## 4. Decisões de Produto

### 4.1 Como identificar o superadmin

**Recomendação: novo papel `SUPERADMIN` no enum `UserRole`, com `User.tenantId = null`.**

O schema já permite (`User.tenantId String?` — já é opcional, `prisma/schema.prisma:156`), então a
tentação é usar só isso: usuário sem `tenantId` = superadmin, sem tocar no enum. **Rejeitado.**
Motivo: `RolesGuard` (`src/common/auth/roles.guard.ts`) decide acesso **só pelo `role`**, nunca olha
`tenantId`. Como desde a decisão (A) **todo dentista já é `MASTER`**, usar `role: MASTER` +
`tenantId: null` para o superadmin tornaria impossível distinguir "dono de consultório" de
"superadmin da Zarko" em qualquer guard existente — cada endpoint novo precisaria lembrar de
checar `tenantId === null` manualmente, à mão, em vez de o compilador/guard garantir isso. É
exatamente o tipo de checagem "esquecível" que causou o bug de vazamento original (ver
`2026-06-16-multi-tenancy-design.md`, que resolveu o problema trocando checagem manual por
`tenantId` mecânico em toda query). Um papel novo mantém o mesmo princípio: permissão decidida por
um campo que o compilador e o guard tratam de forma uniforme.

`tenantId: null` continua sendo usado, mas como **efeito colateral de segurança, não como
identificador**: um superadmin sem Compania não tem, por padrão, `tenantId` nenhum para nenhuma
query tenant-scoped (`Patient`, `Appointment`, `MedicalRecord`, etc.) filtrar — ele simplesmente
não aparece em nada disso a menos que entre em modo suporte (§4.3).

**Custo desta escolha (mecânico, mapeado):**
- `prisma/schema.prisma` — adicionar `SUPERADMIN` ao enum `UserRole`.
- Nova migration Knex (o enum é um tipo nativo Postgres, criado em
  `migrations/20260606300000_create_userrole_enum.js`): `ALTER TYPE "UserRole" ADD VALUE
  'SUPERADMIN'`. Atenção: no Postgres, um valor adicionado por `ALTER TYPE ... ADD VALUE` não pode
  ser usado na mesma transação em que foi adicionado — se algum seed/script rodar logo depois na
  mesma migration/transação, vai falhar. Rodar a migration isolada, e só depois o script de
  provisionamento (ver abaixo).
- `src/common/enums/user-role.enum.ts` — adicionar `SUPERADMIN`.
- `src/common/auth/roles.decorator.ts` — o tipo `UserRole` aí é uma union TS hardcoded
  (`'MASTER' | 'ADMIN' | 'DENTISTA' | 'RECEPCIONISTA'`), não importa o enum do Prisma. Precisa do
  mesmo ajuste manual.
- `src/common/auth/jwt-payload.type.ts` — `tenantId: string` precisa virar `tenantId: string |
  null`. Isso quebra a compilação em todo lugar que hoje assume `tenantId` sempre presente
  (ex.: `UsersController.list`, `UsersController.create` passando `req.user?.tenantId` como
  `string` para `usersService.create`). É o comportamento desejado: força revisar, um por um, cada
  ponto que hoje presume Compania — não silenciar com `as string`.
- **Provisionamento do primeiro superadmin não passa por nenhum fluxo existente:**
  `AuthService.bootstrapMaster` só funciona com `countAll() === 0` (banco vazio) e sempre cria
  Tenant + `MASTER` — inútil em produção, que já tem usuários. `UsersController.create` sempre
  atribui um `tenantId` (do criador, ou um novo se `DENTISTA`) — não tem caminho para criar um
  usuário sem Compania. Portanto o primeiro `SUPERADMIN` precisa de um script novo,
  `tools/create-superadmin.js`, seguindo o mesmo padrão já estabelecido em
  `tools/split-dentistas-em-companias.js` (dry-run por padrão, `--apply` para executar, em `tools/`
  e não em `scripts/` porque o `.gitignore` ignora `scripts/` inteiro e este script mexe em
  produção e precisa ser versionado/revisado). Não expor isso como endpoint HTTP público — criar
  superadmin por rota de API aumentaria superfície de ataque sem necessidade real (é operação
  rara, feita por Pedro).

### 4.2 O que o superadmin pode fazer

- **Listar Companias com métricas agregadas**: nome, slug, `isActive`, quantidade de usuários,
  quantidade de pacientes, quantidade de consultas, data de criação. Endpoint novo — hoje
  `TenantsService.list()` devolve só as colunas cruas do `Tenant`, sem nenhuma contagem
  relacionada. Usa `_count` do Prisma numa única query (sem N+1).
- **Ver detalhe de uma Compania** — mesmas métricas, endpoint por id.
- **Criar Compania manualmente** — reaproveita `TenantsService.create` (já existe, já valida nome
  e slug único). Uso esperado: pré-criar a Compania de um cliente novo antes de qualquer
  cadastro de usuário.
- **Ativar/desativar Compania** — endpoint novo que grava `Tenant.isActive`. **Só faz sentido
  combinado com o achado do §2**: como nada hoje lê esse campo, esta spec inclui, na mesma fatia,
  fazer três pontos passarem a respeitá-lo:
  1. `AuthService.login` — negar login (mesmo padrão do `if (user.isActive === false)` que já
     existe ali) se `tenant.isActive === false`.
  2. `TenantsService.resolveBySlug` (usado pelo booking público por slug) — tratar Compania
     inativa como não encontrada (404), para o formulário público de agendamento parar de
     funcionar para uma Compania desativada.
  3. `ApiKeyGuard` (`src/common/auth/api-key.guard.ts`) — rejeitar chaves de API cujo `tenantId`
     aponte para uma Compania inativa (a integração externa do site do dentista para de aceitar
     agendamento).
  Sem isso, "desativar" continua sendo cosmético, que é exatamente o risco que o Pedro apontou.
- **Fechar o vazamento do §2**: mover `@Roles('MASTER')` para `@Roles('SUPERADMIN')` em
  `GET/POST /api/tenants`.

### 4.3 Impersonação (entrar numa Compania para dar suporte)

**Recomendação: sim, com salvaguardas — sessão curta, auditada, visível na tela, e sem
notificação automática ao cliente no MVP** (ver pergunta em aberto sobre isso).

Justificativa: o próprio pedido de Pedro ("entrar numa Compania para dar suporte") é uma
necessidade real de um software house pequeno sem equipe de suporte dedicada — sem isso, qualquer
bug reportado por um cliente ("sumiu meu paciente", "a agenda não bate") só pode ser investigado
mexendo direto no banco de produção (que é o que já aconteceu nesta sessão, com o script de
correção de dentistas). Impersonação com log é estritamente mais seguro que acesso direto ao
banco.

Mas isso dá acesso a prontuário, anamnese e dado de paciente real — dado de saúde é dado sensível
(LGPD, art. 5º II). Por isso:

- **Sessão curta**: token de impersonação assinado com `expiresIn: '30m'` (o projeto já usa
  `@nestjs/jwt` global com `expiresIn` configurável por chamada — `JwtModule.register` em
  `src/auth/auth.module.ts` tem default `1d` para login normal; o token de impersonação usa um
  override menor na própria chamada de `signAsync`), não é uma sessão "logar como" permanente.
- **Escopo = mesmo acesso de um `MASTER` da Compania-alvo**, não read-only. Justificativa: suporte
  real muitas vezes é "consertar um dado errado", não só olhar — o próprio caso desta sessão
  (dentistas com agenda vazia após a separação de Companias) só se resolve escrevendo. Read-only
  obrigaria voltar ao banco direto para qualquer correção, que é pior.
- **Auditoria obrigatória**: nova tabela `AdminAuditLog` (não existe hoje nenhuma tabela de
  auditoria no schema — grep confirmou) registrando `superadminId`, `tenantId`, `reason` (motivo,
  texto livre), `createdAt`. Nível de auditoria do MVP é **por sessão** (quando entrou, em qual
  Compania), não por ação individual — não existe hoje coluna `updatedBy`/`createdBy` em
  `Patient`/`Appointment`/`MedicalRecord`, e adicionar isso em todas as tabelas clínicas é
  migration grande, fora do escopo desta fatia (ver "Fora de Escopo").
- **Visível na tela**: banner fixo "Modo suporte — Compania X" durante toda a sessão impersonada,
  com botão explícito para sair. Sem isso, é fácil o próprio Pedro esquecer que está "dentro" da
  conta de um cliente.
- **Bloqueado se a Compania estiver desativada** — entrar numa Compania desativada via
  impersonação não faz sentido (é inconsistente com ela estar "fora do ar" para o próprio dono).

### 4.4 O que o superadmin não pode fazer

- **Sem impersonação ativa, zero acesso a dado clínico** — os endpoints de administração cross-
  tenant (`/api/admin/tenants*`) só devolvem metadados da Compania (nome, slug, status, contagens
  agregadas). Nunca devolvem linha de `Patient`, `Appointment`, `MedicalRecord`, `Anamnesis` ou
  `SignatureToken`.
- **Não edita usuário de uma Compania por fora** — não existe endpoint tipo `PATCH
  /api/admin/tenants/:id/users/:userId`. Se precisar mexer em usuário de um cliente (resetar
  senha, reativar conta trancada), a via é impersonar e usar a tela de usuários normal daquela
  Compania — mantém uma única porta de entrada auditada, em vez de duas.
- **Não apaga Compania** — só ativa/desativa. Apagar é destrutivo (perderia pacientes/prontuário
  de verdade) e não foi pedido; fora de escopo desta spec.
- **Não vê senha nem qualquer dado de autenticação** — já garantido pelo `SafeUser`/`SAFE_SELECT`
  existentes em `users.repository.ts`, que a impersonação não muda.
- **Sessão de impersonação não se renova sozinha** — expira em 30 min; para continuar, precisa
  entrar de novo (gera nova linha de auditoria).

---

## 5. Design Detalhado

### 5.1 Schema (Prisma)

```prisma
enum UserRole {
  MASTER
  ADMIN
  DENTISTA
  RECEPCIONISTA
  SUPERADMIN
}

model AdminAuditLog {
  id           String    @id @default(cuid())
  superadminId String
  tenantId     String
  action       String    // "IMPERSONATE_START" no MVP; espaço para outras ações no futuro
  reason       String?
  createdAt    DateTime  @default(now())

  @@index([tenantId])
  @@index([superadminId])
}
```

`User.tenantId` já é `String?` — nenhuma mudança necessária aí. `Tenant.isActive` já existe —
nenhuma mudança de schema, só passa a ser lido (§5.3).

Migration Knex nova: `ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN'` (isolada, ver nota sobre
transação em §4.1) + `CREATE TABLE "AdminAuditLog"`. Seguir o padrão do projeto: Knex migration +
`prisma db push`/`generate` depois (não usar `prisma migrate`, conforme decidido em
`2026-06-16-multi-tenancy-design.md`).

### 5.2 Auth & JWT

- `src/common/auth/jwt-payload.type.ts` — `tenantId: string | null`.
- `src/common/enums/user-role.enum.ts` e `src/common/auth/roles.decorator.ts` — adicionar
  `SUPERADMIN`.
- `AuthService.login` — antes de assinar o token, se `user.tenantId` não for `null`, carregar o
  `Tenant` e rejeitar (mesma exceção usada para `user.isActive === false`) se `tenant.isActive ===
  false`. Usuário sem `tenantId` (o próprio superadmin) pula essa checagem.
- Novo `AdminAuthService.impersonate(superadminId, targetTenantId, reason?)`:
  1. Confirma `Tenant` existe e `isActive`.
  2. Busca um usuário `MASTER` ativo daquela Compania (é sempre o dono/dentista, criado pela
     decisão (A)) — se não existir nenhum (caso extremo, ver §7), erro 409 explicando.
  3. Assina token com o mesmo payload de um login normal desse usuário MASTER, mais
     `impersonatedBy: superadminId`, com `expiresIn: '30m'`.
  4. Grava `AdminAuditLog` (`action: 'IMPERSONATE_START'`).
  5. Retorna o token — o front troca a sessão por ele (§5.4).
- `JwtAuthGuard`/`RolesGuard` não mudam de mecanismo (continuam validando assinatura e `role`);
  o claim `impersonatedBy`, quando presente, só é lido pelo front para desenhar o banner e pelo
  backend, opcionalmente, se algum endpoint futuro quiser bloquear ações específicas durante
  impersonação (nenhum bloqueio desse tipo está no MVP).

**Trade-off assumido e não resolvido nesta spec:** `JwtAuthGuard` valida o token só pela
assinatura, sem consultar o banco a cada request (é assim hoje para todos os usuários, não só
Companias desativadas). Isso significa que, ao desativar uma Compania, um usuário com token já
emitido continua autenticado até o token expirar naturalmente (até 1 dia, no `JWT_EXPIRES_IN`
default) — só um **login novo** é bloqueado na hora. Ver pergunta em aberto sobre isso.

### 5.3 Módulo Admin (novo)

`src/admin/` — novo módulo, importa `TenantsModule` (reaproveita `TenantsService.create`), soma
uma nova query de contagem no `TenantsRepository`:

```ts
// tenants.repository.interface.ts — método novo
listWithCounts(): Promise<(Tenant & {
  _count: { users: number; patients: number; appointments: number };
})[]>;
```

`src/admin/admin-tenants.controller.ts` (`@Controller('api/admin/tenants')`,
`@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles('SUPERADMIN')`):

| Método | Rota | Ação |
|---|---|---|
| GET | `/api/admin/tenants` | lista todas as Companias com contagens |
| GET | `/api/admin/tenants/:id` | detalhe de uma Compania |
| POST | `/api/admin/tenants` | cria Compania (reaproveita `TenantsService.create`) |
| PATCH | `/api/admin/tenants/:id` | `{ isActive: boolean }` |
| POST | `/api/admin/tenants/:id/impersonate` | `{ reason?: string }` → retorna token curto |

`src/tenants/tenants.controller.ts` — trocar `@Roles('MASTER')` por `@Roles('SUPERADMIN')` nas
rotas existentes `GET/POST /api/tenants` (fecha o vazamento do §2; se algo no front hoje depende
dessa rota com um `MASTER` comum, precisa migrar para as novas rotas `/api/admin/tenants` — não
encontrado nenhum uso dela no front além do módulo de configurações da própria Compania, que usa
outras rotas).

### 5.4 Frontend

- `AgendamentoOdonto-front/app/admin/companias/page.tsx` — nova página, seguindo o mesmo padrão de
  gate por papel já usado em `app/configuracoes/usuarios/page.tsx` (`me.role !== 'SUPERADMIN'` →
  tela de acesso negado). Tabela: nome, slug, usuários, pacientes, consultas, status (toggle
  ativo/inativo), botão "Entrar como suporte" por linha, botão "Nova Compania".
- Modal de impersonação: aviso explícito ("Você vai acessar dados reais de paciente desta
  Compania") + campo de motivo (texto livre, não obrigatório no MVP — ver pergunta em aberto) +
  confirmação.
- `components/Sidebar.tsx` — novo item de nav `{ href: '/admin/companias', label: 'Companias',
  roles: ['SUPERADMIN'] }`. E, symmetricamente, **todos os itens de nav clínicos existentes (Visão
  geral, Pacientes, Agenda, Atendimento, Assinaturas, Relatórios, Configurações) passam a excluir
  `SUPERADMIN` da lista de `roles`** — hoje esses itens chamam endpoints tenant-scoped que, para
  um usuário com `tenantId: null`, ou devolveriam vazio de forma confusa (parecendo bug) ou
  quebrariam a assinatura de tipo (`string | null` passado onde o service espera `string`). Um
  superadmin fora de impersonação só deve ver a tela de Companias.
- Sessão/cookie: `src/lib/auth.ts` guarda tudo num único cookie httpOnly `odonto_session`,
  setado só por `app/api/session/login/route.ts`. Impersonação precisa de uma rota nova,
  `app/api/session/impersonate/route.ts`, que troca o conteúdo desse cookie pelo token de
  impersonação **guardando também o `accessToken` original do superadmin** (campo extra no JSON do
  cookie, ex. `returnToken`), para permitir "Sair do modo suporte" sem exigir login de novo. O
  banner de "Modo suporte" (renderizado sempre que a sessão tiver `impersonatedBy`) tem um botão
  que chama uma rota de logout de impersonação, restaura o cookie a partir do `returnToken` e
  redireciona para `/admin/companias`.

---

## 6. Fluxo Principal

1. Pedro loga com a conta `SUPERADMIN` → cai em `/admin/companias` (única tela disponível).
2. Vê a lista de Companias com contagens, identifica a que precisa de suporte.
3. Clica "Entrar como suporte" → confirma no modal (opcionalmente escreve o motivo) → sessão vira
   a da Compania-alvo, banner "Modo suporte" aparece, navegação normal do painel (Pacientes,
   Agenda, etc.) passa a funcionar, escopada àquela Compania.
4. Resolve o problema como faria um `MASTER` comum daquela Compania.
5. Clica "Sair do modo suporte" no banner → volta para `/admin/companias` como `SUPERADMIN`.

## 7. Casos de Borda

- **Compania sem nenhum `MASTER` ativo** (todos os usuários dela foram desativados) — impersonação
  falha com erro claro em vez de silenciosamente logar como um usuário desativado. Situação
  possível hoje: `users.service.ts` bloqueia um `MASTER` de desativar a própria conta, mas não
  impede que outro `MASTER`/`ADMIN` da mesma Compania desative todos os demais.
- **Sessão de impersonação expira no meio de uma ação** — comportamento igual ao de qualquer sessão
  expirada hoje (guard rejeita, front redireciona pro login); não precisa de tratamento especial.
- **Desativar a Compania que está sendo impersonada agora** — não tratado nesta spec (cenário raro:
  o próprio superadmin desativando a Compania que ele está "dentro"); token de impersonação já
  emitido continua válido até expirar (mesmo trade-off do §5.2).
- **Superadmin tentando criar Compania com slug já usado** — mesmo erro já existente em
  `TenantsService.create` (`ConflictException`), sem mudança.

---

## 8. Plano de Testes

1. **RolesGuard/JwtPayload** — token com `tenantId: null` e `role: 'SUPERADMIN'` passa em rota
   `@Roles('SUPERADMIN')` e é rejeitado (403) em qualquer rota `@Roles('MASTER'|'ADMIN'|...)`.
2. **Vazamento fechado** — usuário `MASTER` comum (dentista) chamando `GET/POST /api/tenants`
   recebe 403 (teste de regressão do achado do §2).
3. **Contagens** — `listWithCounts` devolve números corretos e isolados por Compania (teste com
   fixtures de 2+ Companias, cada uma com paciente/consulta próprios).
4. **`isActive` respeitado** — desativar Compania: login de usuário dela passa a falhar;
   `resolveBySlug` passa a lançar `NotFoundException`; `ApiKeyGuard` passa a rejeitar chave daquela
   Compania. Reativar reverte os três.
5. **Impersonação** — token gerado tem `expiresIn` curto, `tenantId` da Compania-alvo,
   `impersonatedBy` do superadmin; grava `AdminAuditLog`; falha (409) se a Compania não tiver
   `MASTER` ativo; falha (400) se a Compania estiver inativa.
6. **Provisionamento** — `tools/create-superadmin.js` em dry-run não escreve no banco; `--apply`
   cria exatamente um usuário `SUPERADMIN` com `tenantId: null` e senha com hash.
7. **Frontend (Vitest)** — Sidebar não mostra itens clínicos para `SUPERADMIN`; página de
   Companias renderiza contagens; modal de impersonação exige confirmação; banner de modo suporte
   aparece quando a sessão tem `impersonatedBy` e some ao sair.

---

## 9. Fatiamento em Slices

### Slice 0 — Papel `SUPERADMIN` + fechar o vazamento existente
- Migration: `SUPERADMIN` no enum `UserRole`.
- `user-role.enum.ts`, `roles.decorator.ts`, `jwt-payload.type.ts` (`tenantId: string | null`)
  atualizados.
- `GET/POST /api/tenants` migram de `@Roles('MASTER')` para `@Roles('SUPERADMIN')`.
- `tools/create-superadmin.js` (dry-run por padrão).

**Critérios de aceite:**
- [ ] `npx knex migrate:latest` aplica sem erro; `\dT+ "UserRole"` no Postgres lista `SUPERADMIN`.
- [ ] Requisição `GET /api/tenants` com token de um `MASTER` comum (dentista) retorna 403.
- [ ] Requisição `GET /api/tenants` com token `SUPERADMIN` retorna 200 com a lista completa.
- [ ] `node tools/create-superadmin.js --email=x --password=y` (sem `--apply`) não altera o banco;
      com `--apply` cria 1 `User` com `role=SUPERADMIN`, `tenantId=null`, senha com hash bcrypt.
- [ ] `tsc` limpo; suíte existente (72 testes back) continua passando.

### Slice 1 — Companias: listar, criar, ativar/desativar (com `isActive` valendo de verdade)
- Módulo `src/admin/` com `admin-tenants.controller.ts`/`service.ts`.
- `TenantsRepository.listWithCounts()`.
- `AuthService.login`, `TenantsService.resolveBySlug`, `ApiKeyGuard` passam a checar
  `tenant.isActive`.
- Frontend: `app/admin/companias/page.tsx`, item de Sidebar `SUPERADMIN`, remoção de itens
  clínicos da Sidebar para `SUPERADMIN`.

**Critérios de aceite:**
- [ ] `GET /api/admin/tenants` devolve, numa única resposta, todas as Companias com
      `usersCount`/`patientsCount`/`appointmentsCount` corretos.
- [ ] `POST /api/admin/tenants` cria Compania nova (mesma validação de slug único já existente).
- [ ] `PATCH /api/admin/tenants/:id` com `{isActive:false}`: login de qualquer usuário daquela
      Compania passa a retornar erro; `GET /api/public/:slug/...` daquela Compania retorna 404;
      request com API Key daquela Compania retorna 401.
- [ ] Reativar (`isActive:true`) reverte os três comportamentos acima.
- [ ] Nenhum papel além de `SUPERADMIN` acessa `/api/admin/*` (403 testado para MASTER, ADMIN,
      RECEPCIONISTA).
- [ ] Login como `SUPERADMIN` no front mostra só o item "Companias" na Sidebar.

### Slice 2 — Impersonação (modo suporte)
- Model + migration `AdminAuditLog`.
- `POST /api/admin/tenants/:id/impersonate`.
- Frontend: botão "Entrar como suporte", modal de confirmação/motivo, rota
  `app/api/session/impersonate/route.ts`, banner de modo suporte, ação de sair.

**Critérios de aceite:**
- [ ] `POST /api/admin/tenants/:id/impersonate` com Compania ativa e com `MASTER` retorna token
      válido para aquela Compania, com `expiresIn` de 30 min.
- [ ] Mesma chamada numa Compania sem nenhum `MASTER` ativo retorna 409 com mensagem clara.
- [ ] Mesma chamada numa Compania inativa retorna 400.
- [ ] Toda chamada bem-sucedida grava 1 linha em `AdminAuditLog` (`superadminId`, `tenantId`,
      `reason`, `createdAt`).
- [ ] No front, ao confirmar impersonação, a navegação passa a mostrar as telas clínicas normais
      (Pacientes, Agenda etc.) escopadas à Compania-alvo, com banner "Modo suporte" fixo.
- [ ] "Sair do modo suporte" restaura a sessão original de `SUPERADMIN` sem exigir novo login.
- [ ] Token de impersonação expira sozinho aos 30 min (teste com token forjado `exp` no passado).

---

## 10. Fora de Escopo (follow-ups)

- Log de auditoria por ação individual (write-level, não só sessão) — exigiria coluna
  `createdBy`/`updatedBy` em `Patient`/`Appointment`/`MedicalRecord`/etc., migration grande demais
  para esta fatia.
- Tela dedicada de consulta ao `AdminAuditLog` (no MVP, consulta é via banco direto).
- Apagar Compania.
- Editar usuário de uma Compania sem impersonar.
- Corte imediato de sessões já emitidas ao desativar uma Compania (ver trade-off assumido em
  §5.2) — se virar requisito, precisa de checagem de `tenant.isActive` no `JwtAuthGuard`, que muda
  o guard de "sem custo de banco" para "1 leitura por request autenticado".
- Granularidade de permissão entre múltiplos superadmins (hoje o modelo trata todo `SUPERADMIN`
  como tendo o mesmo acesso total) — só relevante se mais de uma pessoa da Zarko for ganhar esse
  papel.
- Notificação automática ao cliente quando um superadmin impersona a Compania dele.

---

## 11. Perguntas em Aberto (só Pedro responde)

1. **Corte imediato ao desativar**: aceitável que uma Compania desativada ainda funcione para
   quem já tem um token válido, até ele expirar naturalmente (até 1 dia, hoje)? Ou precisa de
   corte na hora (custo: guard passa a consultar banco a cada request autenticado, não só no
   login)?
2. **Aviso ao cliente**: quando o suporte da Zarko entra numa Compania via impersonação, o dono
   dela deve ser avisado (na hora, ou depois, por e-mail/WhatsApp) ou o log interno (só visível a
   Pedro) é suficiente? É decisão de política/contrato, não técnica — pode valer conversar com
   `juridico-contratos` se for virar cláusula de suporte no contrato do cliente.
3. **Motivo da impersonação**: obrigatório preencher antes de entrar, ou opcional como assumido
   nesta spec?
4. **Retenção do `AdminAuditLog`**: por quanto tempo guardar esse log? Não modelado tempo de
   expurgo nesta spec.
5. **Quantos superadmins existirão**: só Pedro, ou outras pessoas da Zarko também vão ter esse
   papel? Se for mais de uma pessoa, vale revisar se granularidade de permissão (§10) devia entrar
   já no MVP em vez de follow-up.
6. **Companias fantasmas**: hoje, ao rodar `tools/split-dentistas-em-companias.js`, cada dentista
   fica com Compania própria mas agenda vazia (achado registrado no diário do projeto em
   2026-08-16). Companias assim (recém-criadas, zero paciente/consulta ainda) devem aparecer
   destacadas na listagem do superadmin (ex.: badge "sem uso") para facilitar identificar quem
   ainda não migrou dados manualmente? Não modelado nesta spec — se for útil, é ajuste pequeno na
   Slice 1.
