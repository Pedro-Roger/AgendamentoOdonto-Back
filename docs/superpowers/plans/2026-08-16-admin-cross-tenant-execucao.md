# Administração Cross-Tenant (Superadmin) — Plano de Execução

**Data:** 2026-08-16
**Autor:** gestao-projeto (Pedro Roger / Zarko)
**Baseado em:** `docs/superpowers/specs/2026-08-16-admin-cross-tenant-design.md`
**Status:** Proposto — ordem de execução e escopo do hotfix aguardando OK de Pedro; 6 perguntas da
spec (§11) seguem em aberto, ver seção 5.

> Este documento não define *como* implementar (isso está na spec, seção 5, e será detalhado em
> plano de tasks separado quando o hotfix/slices forem aprovados) — define **em que ordem**, **o
> que depende do quê**, e **quais riscos de produção** precisam ser fechados antes de cada etapa
> ir ao ar.

---

## 1. Por que a ordem da spec (Slice 0 → 1 → 2) não é a ordem de execução

A spec já isola corretamente o vazamento do `GET/POST /api/tenants` dentro do Slice 0, mas o
Slice 0 como descrito na spec (§9) ainda embute trabalho que não é sobre o vazamento: enum
`SUPERADMIN`, `jwt-payload.type.ts` virando `string | null` (com efeito cascata em todo lugar que
hoje presume `tenantId` presente), e o script `create-superadmin.js`. Esse pacote inteiro é
seguro de fazer, mas não precisa ir junto pra fechar o buraco — e cada dia que passa com
`@Roles('MASTER')` na rota é um dia em que **qualquer dentista cadastrado no sistema** (não só
Zarko) consegue listar as Companias de todos os outros clientes.

**Decisão de risco:** separar um **Hotfix 0** — o menor diff possível que fecha
`GET/POST /api/tenants` — do resto do Slice 0. O Hotfix 0 vai para produção primeiro, isolado,
sem esperar `SUPERADMIN` existir. O restante do Slice 0 (enum, tipo, script) segue depois, sem
pressa de produção porque o vazamento já estará fechado.

Isso é possível porque **hoje não existe nenhum usuário `SUPERADMIN`** — ou seja, ninguém
consegue usar `/api/tenants` de qualquer forma até o Slice 0 completo existir. Trocar a
verificação por algo mais restrito que `@Roles('MASTER')` já resolve o vazamento sem exigir que o
papel novo exista ainda.

### O que entra no Hotfix 0

Opção mais simples e mais segura: **remover o acesso via papel de usuário comum e restringir a
rota** até o Slice 0 real (com `SUPERADMIN`) chegar. Duas formas possíveis, em ordem de
preferência:

1. **Trocar `@Roles('MASTER')` por um guard de allowlist temporário** (ex.: checar
   `req.user.email` contra uma lista de e-mails da Zarko vinda de env var, ou um novo campo
   booleano leve tipo `isZarkoStaff` no `User` só para essa checagem). Fecha o vazamento sem
   depender do enum novo, sem migration de enum, sem tocar em `jwt-payload.type.ts`. Reversível
   com um único commit quando o Slice 0 completo (com `SUPERADMIN`) estiver pronto.
2. **Se a rota `/api/tenants` não é usada por ninguém hoje** (confirmado: nenhum uso dela
   encontrado no front, `AgendamentoOdonto-front` só usa `/api/tenants` indiretamente via
   onboarding — não achei chamada direta a `GET/POST /api/tenants` no front, ver §3.3) — a opção
   mais simples ainda é **desligar a rota**: `@Roles()` sem nenhum papel válido do enum atual
   (nenhum `MASTER`/`ADMIN`/`DENTISTA`/`RECEPCIONISTA` deveria bater), ou remover o
   `@UseGuards`/`@Roles` e trocar por uma checagem que sempre nega (`ForbiddenException` direto no
   controller) até o Slice 0 chegar. Mais grosseiro, mas zero risco de regressão em outra rota,
   porque não mexe em guard compartilhado nem em tipo.

Recomendação: opção 2 (desligar a rota) se Pedro confirmar que ninguém do time da Dra. Herlania
(ou de outro cliente) precisa criar/listar Companias por essa rota hoje — o que parece ser o caso,
já que o único fluxo de criação de Compania em uso é o automático (`createForDentist`, decisão A).
Se houver alguma dependência não mapeada, cair para a opção 1.

**Não entra no Hotfix 0:** enum `SUPERADMIN`, `AdminAuditLog`, impersonação, tela de Companias,
`isActive` valendo de verdade. Isso é Slice 0 completo → 1 → 2, na sequência normal.

**Tamanho estimado:** 1 arquivo (`tenants.controller.ts`), sem migration, sem mudança de schema,
sem mudança de tipo compartilhado (`jwt-payload.type.ts`) — não deveria disparar o efeito cascata
que o resto do Slice 0 dispara. Testável em isolamento: request de `MASTER` comum em
`GET /api/tenants` deve virar 403.

---

## 2. Ordem de execução recomendada

```
Hotfix 0 ──────────────► produção (imediato, isolado)
   │
   ▼
Slice 0 completo (enum SUPERADMIN, tipo, script) ──► produção
   │
   ├──► Slice 1 (Companias: listar/criar/ativar-desativar, isActive valendo)
   │        │
   │        ▼
   └──► Slice 2 (impersonação) — depende de Slice 1 (precisa da tela/rotas de Companias existirem
            e de isActive já valendo, porque impersonação é bloqueada se a Compania estiver
            inativa — spec §4.3)
```

- **Hotfix 0** não depende de nada. Vai primeiro, sozinho.
- **Slice 0 completo** depende do Hotfix 0 só na medida em que reintroduz a mesma rota com o
  controle certo (`@Roles('SUPERADMIN')`) — não há conflito técnico em fazer os dois quase juntos,
  mas o Hotfix 0 não deve *esperar* o Slice 0 ficar pronto.
- **Slice 1** depende do Slice 0 completo (precisa do papel `SUPERADMIN` existir e de alguém
  provisionado via `create-superadmin.js` para sequer testar as rotas novas).
- **Slice 2** depende do Slice 1: a spec bloqueia impersonação em Compania inativa (§4.3), então
  sem `isActive` valendo de verdade (Slice 1) essa checagem não tem o que checar; também reaproveita
  a tela de Companias do Slice 1 para o botão "Entrar como suporte".

## 3. Por slice: o que entra, dependências, backend/frontend, produção

### 3.1 Hotfix 0 — fechar `/api/tenants`
- **Entra:** ver §1. Só backend.
- **Depende de:** nada.
- **Backend:** sim (`src/tenants/tenants.controller.ts`).
- **Frontend:** nenhum — confirmado que não há chamada direta a `/api/tenants` no
  `AgendamentoOdonto-front` (grep não encontrou; a única superfície relacionada a Companias no
  front hoje é o onboarding, que cria Compania por outro caminho). **Recomendo Pedro confirmar
  isso antes do deploy** — se houver alguma tela administrativa fora do repositório rastreado
  (script manual, Postman, etc.) usando essa rota com um `MASTER` comum, ela para de funcionar.
- **Produção:** nenhuma migration, nenhum dado tocado. Só muda comportamento de autorização de uma
  rota. Risco de regressão: baixo, e testável direto (request de teste com token `MASTER` real
  contra o ambiente de produção após deploy, esperando 403).

### 3.2 Slice 0 completo — papel `SUPERADMIN`
- **Entra:** migration do enum, `user-role.enum.ts`, `roles.decorator.ts`,
  `jwt-payload.type.ts` (`tenantId: string | null`), `tools/create-superadmin.js`, e a
  rota `/api/tenants` final com `@Roles('SUPERADMIN')` (substitui o estado do Hotfix 0).
- **Depende de:** Hotfix 0 já em produção (não bloqueia tecnicamente, mas não há razão para
  acelerar isso antes do vazamento estar fechado por outra via).
- **Backend:** sim, é praticamente só backend. `jwt-payload.type.ts` virando `string | null` é o
  ponto que mais espalha: todo lugar que hoje assume `req.user.tenantId: string` (ex.:
  `UsersController.list`, `UsersController.create`) precisa ser revisado — a spec já mapeia isso
  em §4.1 como intencional ("força revisar, um por um"), não é side effect escondido.
- **Frontend:** nenhum nesta fatia — a tela de Companias é Slice 1.
- **Produção — mexe em base real:**
  - Migration `ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN'`. **Rodar isolada**, sem nenhum
    seed/script na mesma transação (a spec já aponta essa restrição do Postgres em §4.1 — confirmar
    que a migration nova segue o padrão das duas migrations existentes do enum
    (`20260606300000_create_userrole_enum.js`, lida acima), que já lidam com `DO $$ ...
    EXCEPTION WHEN duplicate_object` e trocam `DEFAULT`/tipo com cuidado. `ADD VALUE` é mais
    simples que a migration original (não precisa recriar o tipo), mas herda a mesma exigência de
    não usar o valor novo na mesma transação em que foi criado.
  - `tools/create-superadmin.js` roda **depois**, fora da transação da migration, criando o
    primeiro usuário `SUPERADMIN` (dry-run por padrão, confirmar dry-run limpo antes de `--apply`
    em produção, mesmo padrão do `split-dentistas-em-companias.js` já usado nesta base).
  - Nenhum dado existente é reescrito — é aditivo (novo valor de enum, novo usuário). Risco de
    produção baixo, mas real: um `ALTER TYPE` mal executado (ex. dentro de uma transação com outro
    DDL) falha e pode deixar a migration em estado parcial — seguir a mesma disciplina de migration
    isolada que a spec já recomenda.

### 3.3 Slice 1 — Companias (listar/criar/ativar-desativar, `isActive` valendo)
- **Entra:** módulo `src/admin/`, `TenantsRepository.listWithCounts()`, `AuthService.login` +
  `TenantsService.resolveBySlug` + `ApiKeyGuard` passando a checar `tenant.isActive`; front
  `app/admin/companias/page.tsx` + ajuste de `Sidebar.tsx` (esconder itens clínicos de
  `SUPERADMIN`).
- **Depende de:** Slice 0 completo (precisa de `SUPERADMIN` existir para logar e testar).
- **Backend:** sim, é a maior parte do trabalho (3 pontos de leitura de `isActive` + módulo admin
  novo com métrica agregada).
- **Frontend:** sim — página nova + mudança na Sidebar.
- **Produção — risco real, não cosmético:** ver seção 4 abaixo. Este é o ponto que exige checagem
  manual antes do deploy, não só teste automatizado.

### 3.4 Slice 2 — Impersonação
- **Entra:** model + migration `AdminAuditLog`, `POST /api/admin/tenants/:id/impersonate`, front
  (botão, modal, rota de troca de cookie, banner).
- **Depende de:** Slice 1 (bloqueio de impersonação em Compania inativa; reaproveita a tela de
  Companias para o botão "Entrar como suporte").
- **Backend:** sim (nova tabela, novo endpoint, `AdminAuthService`).
- **Frontend:** sim, é a fatia com mais superfície de front (modal, banner persistente, rota de
  troca/restauração de cookie httpOnly).
- **Produção — mexe em base real:** migration aditiva (`CREATE TABLE "AdminAuditLog"`), sem tocar
  dado existente. Risco baixo comparado ao Slice 1, mas semanticamente é a fatia mais sensível do
  ponto de vista de dado de paciente (LGPD) — depende das respostas às perguntas 2 e 3 da seção 5
  abaixo antes de ir ao ar (não bloqueia o *código*, mas idealmente não deveria ir a produção sem
  a política de aviso ao cliente decidida, para não criar um precedente de fato antes de decidir
  a regra).

---

## 4. Riscos de produção detalhados

### 4.1 Migration do enum `UserRole` (Slice 0)
Roda contra base com dado real (usuários reais, incluindo a própria Dra. Herlania e os dentistas
já migrados pela decisão A). `ADD VALUE` é uma operação aditiva de baixo risco em si — não altera
linhas existentes, só o domínio de valores aceitos. O risco está no *procedimento*: não pode ser
executada na mesma transação em que o valor novo é consumido (confirmado na spec, §4.1, e é
comportamento documentado do Postgres). Seguir a mesma disciplina das duas migrations do enum já
existentes (`20260606300000_create_userrole_enum.js`) — que já lidam com esse tipo de cuidado
transacional no projeto.

**Checagem antes de rodar em produção:** confirmar que o pipeline de deploy roda `knex
migrate:latest` como um passo isolado, não dentro do mesmo processo/transação que sobe a API nova
(se `create-superadmin.js` for chamado automaticamente por algum script de deploy, teria que rodar
depois, não junto).

### 4.2 `Tenant.isActive` passando a valer de verdade (Slice 1) — risco real, checagem obrigatória

Verificado no schema (`prisma/schema.prisma:120`): `isActive Boolean @default(true)`. A coluna
**já existe em produção** desde a migration `20260520120000_init_schema.js` (não é campo novo) —
ou seja, todo `Tenant` criado até hoje recebeu `true` automaticamente, a menos que algum processo
tenha gravado `false` manualmente depois. Busquei no código inteiro (`src/`, `tools/`, `test/`)
por qualquer lugar que grave `isActive: false` em `Tenant` — **não encontrei nenhum** (os únicos
`isActive: false` do repositório são de `User` e `Service`, entidades diferentes). Isso quer dizer
que, hoje, é esperado que **toda Compania em produção esteja com `isActive = true`**.

Mas "esperado pelo código" não é o mesmo que "confirmado no banco real" — o dado de produção pode
ter sido alterado por fora do código (acesso direto ao banco, alguma correção manual anterior não
documentada, como aconteceu com o script de split de dentistas). **Antes de fazer o deploy do
Slice 1, rodar em produção:**

```sql
SELECT id, name, slug, "isActive" FROM "Tenant" WHERE "isActive" = false;
```

Se o resultado vier vazio, o deploy do Slice 1 não deveria derrubar acesso de ninguém que está
usando o sistema hoje. Se vier alguma linha, **investigar com Pedro antes de fazer o deploy** — uma
Compania real e ativa hoje passaria a ser bloqueada no login/booking/API assim que o Slice 1 subir,
o que seria um incidente, não uma correção.

### 4.3 Provisionamento do primeiro `SUPERADMIN`
`tools/create-superadmin.js` roda dry-run por padrão (mesmo padrão do
`split-dentistas-em-companias.js`) — confirmar dry-run limpo (exatamente 1 usuário seria criado,
com o e-mail esperado) antes de rodar `--apply` contra produção. Sem isso, ninguém consegue testar
Slice 0/1/2 em produção de qualquer forma — é pré-requisito prático, não só de segurança.

### 4.4 Sessões já emitidas ao desativar uma Compania (trade-off já assumido na spec, §5.2)
Não é um risco de *migration*, mas é um risco operacional que vale registrar aqui: mesmo depois do
Slice 1, desativar uma Compania não derruba, na hora, quem já está logado (token válido até 1 dia,
`JWT_EXPIRES_IN` atual). Se o motivo de desativar for algo urgente (ex. inadimplência com pedido de
corte imediato, ou suspeita de abuso), a expectativa de "desativei, então já não tem mais acesso"
não é verdadeira até a Pergunta 1 da seção 5 ser resolvida. Comunicar isso a Pedro antes da
primeira vez que essa função for usada para valer.

---

## 5. Bloqueado por decisão de Pedro (spec §11) — o que trava o quê

| # | Pergunta (spec §11) | Bloqueia algum slice? |
|---|---|---|
| 1 | Corte imediato de sessão ao desativar Compania vs. aceitar até 1 dia de atraso | **Não bloqueia** nenhum slice para começar — o comportamento "sem corte imediato" já é o default descrito na spec (guard não consulta banco por request hoje). Só vira trabalho extra (mudar o guard para 1 leitura por request) se Pedro pedir corte imediato depois. Pode seguir com Slice 1 sem essa resposta, documentando o trade-off (feito em §4.4 acima). |
| 2 | Avisar cliente quando suporte entra na conta dele, ou log interno basta | **Bloqueia o uso real do Slice 2 em produção com cliente pagante**, não bloqueia o código. Dá para implementar e testar Slice 2 sem essa resposta, mas não deveria ser usado em Compania de cliente real antes de decidir — é política/contrato, vale envolver `juridico-contratos` se virar cláusula. |
| 3 | Motivo da impersonação obrigatório ou opcional | **Não bloqueia** — spec já assume opcional como default (§4.3). Mudar para obrigatório depois é validação de DTO, mudança pequena. |
| 4 | Retenção do `AdminAuditLog` | **Não bloqueia** nenhum slice — é rotina de expurgo, pode ser decidida depois do MVP estar no ar, é follow-up (spec §10). |
| 5 | Quantos superadmins vão existir | **Não bloqueia** Slice 0/1/2 como modelados (todo `SUPERADMIN` tem acesso total, não há granularidade no MVP). Só importa se a resposta for "mais de uma pessoa" — nesse caso, vale reavaliar se granularidade de permissão entra no escopo antes do Slice 2 ir a produção, em vez de depois. |
| 6 | Companias "fantasmas" (agenda vazia após split) destacadas na listagem | **Não bloqueia** — é ajuste pequeno dentro do Slice 1, pode entrar depois sem retrabalho (é só um badge condicional sobre dado que já vai estar na query de contagens). |

**Resumo prático:** nenhuma das 6 perguntas impede começar o Hotfix 0, o Slice 0 ou o Slice 1.
Só a pergunta 2 tem peso real antes de Slice 2 ir ao ar com cliente de verdade (não com a própria
Dra. Herlania sendo o único tenant testado) — as demais podem ser respondidas em paralelo, sem
travar o cronograma.

---

## 6. Resumo da ordem para Pedro decidir

1. **Hotfix 0** (desligar/restringir `GET/POST /api/tenants`) — hoje, isolado, sem esperar o resto.
   Peço confirmação: ninguém depende dessa rota hoje fora do próprio painel? (não encontrei uso no
   front, mas Pedro pode saber de uso externo/manual que eu não veria por grep).
2. **Slice 0 completo** (enum `SUPERADMIN` + script) — migration isolada, rodar
   `SELECT ... WHERE isActive = false` como checagem preventiva já vale fazer aqui, adiantando o
   Slice 1.
3. **Slice 1** (Companias + `isActive` valendo) — só depois da checagem de §4.2 vir limpa.
4. **Slice 2** (impersonação) — código pode ficar pronto em paralelo ao Slice 1, mas uso real em
   produção com cliente pagante depende da resposta à pergunta 2 (§5).

Nenhuma decisão de Pedro impede começar a trabalhar hoje. O único ponto de bloqueio real de
*produção* (não de código) é a checagem do dado de `Tenant.isActive` antes do Slice 1 subir.
