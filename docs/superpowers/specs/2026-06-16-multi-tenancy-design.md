# Multi-Tenancy + Dashboard, Agenda Visual e UX — Design

**Data:** 2026-06-16
**Autor:** Pedro (pedronisashi@gmail.com) + Claude
**Status:** Aprovado para implementação

---

## 1. Problema

O sistema tem múltiplos usuários (dentistas), mas **os dados vazam entre todos**.
Pacientes, agendamentos, horários e serviços aparecem para todos os usuários
porque nenhuma entidade de dados carrega um identificador de tenant.

**Modelo mental:** cada dentista/clínica é uma **Compania** (= `Tenant`). Cada
compania tem seus próprios clientes, serviços, horários e **site externo próprio**.
O formulário de agendamento precisa ser integrável ao site externo de cada
compania, e toda submissão precisa ser **atribuída à compania correta**.

O schema já possui o model `Tenant` e o campo `User.tenantId`, mas:
- Nenhuma entidade de dados (`Patient`, `Appointment`, `Schedule`, `Service`,
  `FormSetting`, `WhatsAppConfig`, `Notification`) tem `tenantId`.
- O JWT não carrega `tenantId`.
- Nenhum repository filtra por tenant.
- Não existe módulo `Tenant` (service/repository/controller) — só o model.

## 2. Decisão de Arquitetura

**Row-Level Security via `tenantId`** (Opção A escolhida sobre banco-por-tenant
e schema-por-tenant). Padrão da indústria (Clinicorp, iDental, Simples Dental),
eficiente com índice, totalmente testável, e cada mudança é mecânica e coberta
pelo compilador TypeScript + testes.

**Banco será resetado** (ambiente sem dados de produção a preservar) — sem
migração de dados legados.

**Projeto usa migrations Knex** (`migrations/*.js`) com schema Prisma sincronizado
manualmente via `prisma db push` / `prisma generate`. NÃO usar `prisma migrate`.

## 3. Escopo

1. **Multi-tenancy** — isolar todos os dados por `tenantId` (o bug)
2. **Módulo Tenant** — CRUD + resolução por `slug` para booking público
3. **Integração externa** — API genérica + API Key por compania para o site
   externo de cada compania enviar agendamentos, com atribuição da origem
4. **Dashboard** com métricas visuais (KPIs + gráficos)
5. **Agenda visual** (calendário semanal por tenant)
6. **UX/UI** — dark mode, onboarding de novo dentista, identidade por tenant

---

## 4. Design Detalhado

### 4.1 Schema & Dados (Prisma)

Adicionar `tenantId String` + relação `tenant Tenant @relation(fields:[tenantId], references:[id])`
e `@@index([tenantId])` em:

- `Patient` — e trocar `cpf @unique` global por `@@unique([cpf, tenantId])`
- `Appointment`
- `Schedule`
- `Service`
- `FormSetting`
- `WhatsAppConfig`
- `Notification`

`Tenant` ganha as relações inversas (`patients`, `appointments`, `schedules`,
`services`, `formSettings`, `whatsappConfigs`, `notifications`, `apiKeys`).

`Appointment` ganha `source String @default("INTERNAL")` e `apiKeyId String?`
para rastrear a origem (interno / booking público / integração externa).

Model novo `ApiKey` (ver §4.6) com migration Knex própria.

**Migration Knex** `migrations/20260616120000_add_tenant_id.js`:
- Cria/garante tabela `Tenant` (caso reset).
- Adiciona coluna `tenantId` (NOT NULL, FK → `Tenant.id`) em cada tabela.
- Cria índices `*_tenantId_idx`.
- Substitui unique de `Patient.cpf` por unique composto `(cpf, tenantId)`.
- `down` reverte (remove colunas, restaura unique simples).

Após a migration: `prisma db push` + `prisma generate` para sincronizar o client.

### 4.2 Auth & JWT

- `AuthService.login` assina `{ sub, email, role, tenantId }` (já carrega o user
  do banco, basta incluir `user.tenantId`).
- `JwtAuthGuard` inalterado — `tenantId` chega em `req.user.tenantId`.
- Novo decorator `@CurrentUser()` (`src/common/auth/current-user.decorator.ts`)
  extrai `req.user` tipado como `JwtPayload { sub, email, role, tenantId }`.
- `bootstrapMaster` cria o primeiro `Tenant` + o user MASTER associado a ele.

### 4.3 Módulo Tenant (novo)

`src/tenants/` com:
- `tenants.repository.ts` (+interface) — `findBySlug`, `findById`, `create`, `list`
- `tenants.service.ts` — regras (slug único, ativo)
- `tenants.controller.ts` — CRUD protegido por `@Roles('MASTER')`
- Usado pela rota pública de booking para resolver `slug → tenantId`

### 4.4 Repositories & Isolamento

Todos os métodos públicos dos repositories recebem `tenantId` obrigatório.
Nenhuma query sem `WHERE tenantId = ?`. Interfaces atualizadas — esquecer um
método quebra a compilação.

Pontos específicos:
- `PatientsRepository.findByCpf` → `findByCpfAndTenant(cpf, tenantId)`
- `SchedulesRepository.replaceAll` → `deleteMany({ where: { tenantId } })`
- `AppointmentsRepository` — todos os `findBy*` incluem `tenantId`
- `NotificationsService` — todas as queries por tenant
- `WhatsAppConfigRepository` / `FormSettingsRepository` — `findFirst/findLatest`
  filtram por tenant

### 4.5 Controllers & Services

- Controllers autenticados usam `@CurrentUser()` e passam `user.tenantId` ao service.
- Rota pública `GET/POST /api/public/:slug/...` (booking) resolve tenant pelo slug.
  - `getAvailableSchedules`, `createAppointment`, `listActiveServices`,
    `getFormSettings` passam a operar no tenant resolvido.

### 4.6 Integração Externa (API Key por Compania)

Cada compania tem uma ou mais **API Keys** para integrar o formulário do seu
site externo. A submissão é atribuída à compania pela chave — não há login.

**Model novo** `ApiKey`:
```prisma
model ApiKey {
  id           String    @id @default(cuid())
  tenantId     String
  name         String              // ex.: "Site institucional"
  keyHash      String    @unique   // hash SHA-256 da chave; a chave em claro só
                                    // é exibida uma vez na criação
  prefix       String              // primeiros 8 chars, p/ exibição/identificação
  allowedOrigins String[]          // domínios permitidos (CORS/anti-abuso), vazio = qualquer
  lastUsedAt   DateTime?
  revokedAt    DateTime?
  createdAt    DateTime  @default(now())
  tenant       Tenant    @relation(fields: [tenantId], references: [id])
  @@index([tenantId])
}
```

**Guard novo** `ApiKeyGuard` (`src/common/auth/api-key.guard.ts`):
- Lê header `X-Api-Key`.
- Faz hash e busca `ApiKey` por `keyHash` (não revogada).
- Valida `Origin`/`Referer` contra `allowedOrigins` (se configurado).
- Injeta `req.tenantId` e atualiza `lastUsedAt` (best-effort).
- Rejeita com 401 se inválida/revogada.

**Endpoint público de integração:**
`POST /api/integrations/appointments` (protegido por `ApiKeyGuard`, com rate-limit
via Throttler). Corpo = mesmo `CreateAppointmentDto` do booking. Cria **direto**
o `Appointment` no tenant da API Key (decisão: sem fila de aprovação).
- Valida que `serviceId`/horário pertencem ao mesmo tenant (defesa contra IDs
  forjados de outra compania).
- Reaproveita `PatientAppointmentsService.createAppointment`, agora com `tenantId`.

**Endpoints auxiliares para o site externo montar o formulário** (mesma API Key):
- `GET /api/integrations/services` — serviços ativos da compania
- `GET /api/integrations/form-settings` — campos de anamnese
- `GET /api/integrations/availability?serviceId=&date=` — horários livres

**Gestão de keys** (`src/api-keys/`, protegido `@Roles('MASTER','ADMIN')`):
- `POST /api/api-keys` — gera chave (retorna em claro UMA vez), guarda hash
- `GET /api/api-keys` — lista (prefix + lastUsedAt, nunca a chave)
- `DELETE /api/api-keys/:id` — revoga (`revokedAt`)

**Atribuição/rastreio de origem:** cada `Appointment` criado por integração
registra a origem. Adicionar a `Appointment`:
`source String @default("INTERNAL")` (`INTERNAL | PUBLIC | INTEGRATION`) e
`apiKeyId String?` (qual chave originou). Permite ao dashboard mostrar de onde
vieram os agendamentos.

`Tenant` ganha relação inversa `apiKeys ApiKey[]`.

### 4.7 Dashboard

**Endpoint:** `GET /api/dashboard?from=&to=` (autenticado, filtrado por tenant).

Resposta:
```ts
{
  totalAppointments: number,
  newPatients: number,
  revenue: number,                          // 0 até FIN-001 existir
  appointmentsByDay: { date: string, count: number }[],
  appointmentsByService: { name: string, count: number }[],
  appointmentsBySource: { source: string, count: number }[],  // INTERNAL/PUBLIC/INTEGRATION
  upcomingToday: number,
}
```

**Frontend** — página Dashboard (substitui placeholder):
- Cards KPI (consultas, pacientes novos, receita)
- Gráfico de linha (consultas/dia) e pizza (por serviço) via `recharts`
- Seletor de período 7d / 30d / personalizado

### 4.8 Agenda Visual

Reutiliza `GET /api/appointments?from=&to=` (agora por tenant).
Frontend: grade semanal (dias × horários derivados dos `Schedule` do tenant),
cards de consulta coloridos por status, navegação de semana, modal de novo
agendamento ao clicar slot vazio. **Drag-and-drop fica para fase 2 (follow-up).**

### 4.9 UX/UI

- Dark mode (Tailwind `class` strategy + toggle em `localStorage`)
- Onboarding de novo dentista: wizard 3 passos (clínica → horários → 1º serviço)
- Identidade por tenant: logo + nome no header (lidos do `Tenant`)
- Refinamento: sombras suaves, espaçamento consistente, estados loading/empty
- **Página "Integração"** nas configs da compania: gerar/revogar API Keys,
  configurar domínios permitidos, e mostrar um snippet de exemplo (curl/JS `fetch`)
  pronto para colar no site externo, com a chave e o endpoint preenchidos

---

## 5. Plano de Testes (TDD — teste antes da implementação)

1. **Repositories (teste-chave do bug)** — query do tenant A NUNCA retorna dados
   do tenant B. Um teste por repository.
2. **Services** — `tenantId` propagado corretamente em cada chamada.
3. **Auth** — JWT carrega `tenantId`; `findBySlug` resolve o tenant correto;
   booking público usa o tenant do slug.
4. **Integração externa** — `ApiKeyGuard` aceita chave válida e rejeita
   inválida/revogada; submissão é atribuída ao tenant da chave; `serviceId` de
   outra compania é rejeitado; `Origin` fora de `allowedOrigins` é bloqueado;
   `Appointment` registra `source=INTEGRATION` e `apiKeyId`.
5. **Dashboard** — agregações retornam números corretos e isolados por tenant,
   incluindo quebra por origem.
6. **Frontend (Vitest)** — gráficos e grade da agenda renderizam com dados mock;
   toggle de dark mode persiste; página de integração gera/exibe key uma vez.

Backend: `npm test` (Jest, runInBand). Frontend: `vitest run`.

---

## 6. Fora de Escopo (follow-ups)

- Drag-and-drop na agenda (fase 2)
- Módulo financeiro real (FIN-001) — dashboard mostra receita 0 por ora
- Subdomínio por tenant (decidimos por slug em path)
- Migração de dados legados (banco será resetado)

---

## 7. Ordem de Implementação

1. Schema Prisma + migration Knex + reset do banco
2. Módulo Tenant (repo/service/controller) + testes
3. JWT com `tenantId` + `@CurrentUser` + bootstrap cria tenant + testes
4. Repositories filtrados por tenant + testes de isolamento (o bug)
5. Services + controllers propagando `tenantId` + booking público por slug
6. Model `ApiKey` + `ApiKeyGuard` + módulo de integração externa + testes
7. Dashboard backend (com quebra por origem) + testes
8. Frontend: dashboard, agenda, dark mode, onboarding, identidade por tenant,
   página de integração (gerar/revogar API Key + snippet)
