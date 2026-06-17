# Multi-Tenancy Backend Implementation Plan (Plano 1 de 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolar todos os dados por compania (tenant), corrigir o vazamento entre dentistas, e expor uma API de integração por API Key para os sites externos das companias.

**Architecture:** Row-Level Security via coluna `tenantId` em todas as entidades de dados. O JWT carrega `tenantId`; um decorator `@CurrentUser()` o extrai. Repositories exigem `tenantId` em todo método (o compilador TS garante). Um `ApiKeyGuard` autentica submissões externas e injeta o tenant da chave. Dashboard agrega por tenant.

**Tech Stack:** NestJS, Prisma (client sincronizado via `prisma db push`), Knex (migrations), PostgreSQL, Jest (`npm test`, runInBand).

**Escopo deste plano:** somente backend. Frontend (dashboard UI, agenda visual, dark mode, onboarding, página de integração) fica no Plano 2.

**Convenção de teste do projeto:** services e guards são testados como unidades com dependências mockadas (sem DB). Repositories são testados mockando `PrismaService` e asseverando que o `where`/`data` enviado ao Prisma inclui `tenantId`. Seguir esse padrão.

---

## File Structure

**Schema & migrations:**
- Modify: `prisma/schema.prisma` — `tenantId` em 7 models + model `ApiKey` + `Appointment.source/apiKeyId`
- Create: `migrations/20260617120000_add_tenant_id.js` — colunas tenantId + índices + unique composto de cpf
- Create: `migrations/20260617121000_add_api_keys_and_source.js` — tabela ApiKey + colunas source/apiKeyId

**Tenant module (novo):**
- Create: `src/tenants/tenants.module.ts`
- Create: `src/tenants/tenants.service.ts`
- Create: `src/tenants/tenants.controller.ts`
- Create: `src/tenants/repositories/tenants.repository.ts` + `.interface.ts`
- Create: `src/tenants/dto/create-tenant.dto.ts`

**Auth:**
- Create: `src/common/auth/jwt-payload.type.ts`
- Create: `src/common/auth/current-user.decorator.ts`
- Create: `src/common/auth/api-key.guard.ts`
- Modify: `src/auth/auth.service.ts` — JWT com tenantId + bootstrap cria tenant

**API Keys (novo):**
- Create: `src/api-keys/api-keys.module.ts` / `.service.ts` / `.controller.ts`
- Create: `src/api-keys/repositories/api-keys.repository.ts` + `.interface.ts`

**Integração externa (novo):**
- Create: `src/integrations/integrations.module.ts` / `.controller.ts`

**Repositories tornados tenant-aware (modify):**
- `src/patients/repositories/patients.repository.ts` + `.interface.ts`
- `src/appointments/repositories/appointments.repository.ts` + `.interface.ts`
- `src/clinic-config/repositories/{schedules,services,form-settings}.repository.ts` + interfaces
- `src/whatsapp/whatsapp-config.repository.ts`
- `src/notifications/notifications.service.ts`

**Services/controllers propagando tenant (modify):**
- `src/patients/*`, `src/appointments/*`, `src/clinic-config/*`, `src/patient-appointments/*`, `src/notifications/*`

**Dashboard (novo):**
- Create: `src/dashboard/dashboard.module.ts` / `.service.ts` / `.controller.ts`

**App wiring:**
- Modify: `src/app.module.ts` — registrar TenantsModule, ApiKeysModule, IntegrationsModule, DashboardModule

---

## Task 1: Schema Prisma — tenantId nas entidades + model ApiKey

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Editar schema.prisma**

Em cada model abaixo adicionar o campo e índice. Exemplo para `Patient` (trocar unique de cpf):

```prisma
model Patient {
  id             String          @id @default(cuid())
  tenantId       String
  name           String
  cpf            String
  email          String
  phone          String
  appointments   Appointment[]
  medicalRecords MedicalRecord[]
  tenant         Tenant          @relation(fields: [tenantId], references: [id])
  @@unique([cpf, tenantId])
  @@index([tenantId])
}
```

Adicionar `tenantId String`, `tenant Tenant @relation(fields: [tenantId], references: [id])` e `@@index([tenantId])` também em: `Appointment`, `Schedule`, `Service`, `FormSetting`, `WhatsAppConfig`, `Notification`.

Em `Appointment` adicionar ainda:
```prisma
  source   String  @default("INTERNAL")
  apiKeyId String?
```

Novo model:
```prisma
model ApiKey {
  id             String    @id @default(cuid())
  tenantId       String
  name           String
  keyHash        String    @unique
  prefix         String
  allowedOrigins String[]  @default([])
  lastUsedAt     DateTime?
  revokedAt      DateTime?
  createdAt      DateTime  @default(now())
  tenant         Tenant    @relation(fields: [tenantId], references: [id])
  @@index([tenantId])
}
```

No model `Tenant` adicionar as relações inversas:
```prisma
  patients        Patient[]
  appointments    Appointment[]
  schedules       Schedule[]
  services        Service[]
  formSettings    FormSetting[]
  whatsappConfigs WhatsAppConfig[]
  notifications   Notification[]
  apiKeys         ApiKey[]
```

- [ ] **Step 2: Validar o schema**

Run: `cd AgendamentoOdonto-Back && npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid 🚀"

- [ ] **Step 3: Gerar o client**

Run: `npm run prisma:generate`
Expected: "Generated Prisma Client" sem erros.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): tenantId em todas as entidades + model ApiKey + source no Appointment"
```

---

## Task 2: Migration Knex — tenantId, índices, unique composto

**Files:**
- Create: `migrations/20260617120000_add_tenant_id.js`

- [ ] **Step 1: Escrever a migration**

```js
/**
 * Adiciona tenantId (FK -> Tenant) em todas as entidades de dados,
 * cria índices e troca o unique de Patient.cpf por (cpf, tenantId).
 * @param {import('knex').Knex} knex
 */
const TABLES = ['Patient', 'Appointment', 'Schedule', 'Service', 'FormSetting', 'WhatsAppConfig', 'Notification'];

exports.up = async function up(knex) {
  for (const t of TABLES) {
    const hasCol = await knex.schema.hasColumn(t, 'tenantId');
    if (!hasCol) {
      await knex.schema.alterTable(t, (table) => {
        table.string('tenantId').notNullable();
        table.foreign('tenantId').references('id').inTable('Tenant');
        table.index(['tenantId'], `${t}_tenantId_idx`);
      });
    }
  }
  // Patient.cpf: dropar unique simples, criar composto
  await knex.raw(`ALTER TABLE "Patient" DROP CONSTRAINT IF EXISTS "Patient_cpf_key"`);
  await knex.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Patient_cpf_tenantId_key" ON "Patient" ("cpf", "tenantId")`,
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS "Patient_cpf_tenantId_key"`);
  await knex.raw(`ALTER TABLE "Patient" ADD CONSTRAINT "Patient_cpf_key" UNIQUE ("cpf")`);
  for (const t of TABLES) {
    const hasCol = await knex.schema.hasColumn(t, 'tenantId');
    if (hasCol) {
      await knex.schema.alterTable(t, (table) => {
        table.dropForeign('tenantId');
        table.dropIndex(['tenantId'], `${t}_tenantId_idx`);
        table.dropColumn('tenantId');
      });
    }
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add migrations/20260617120000_add_tenant_id.js
git commit -m "feat(migration): tenantId + indices + unique composto de cpf"
```

---

## Task 3: Migration Knex — tabela ApiKey + source/apiKeyId

**Files:**
- Create: `migrations/20260617121000_add_api_keys_and_source.js`

- [ ] **Step 1: Escrever a migration**

```js
/**
 * Cria a tabela ApiKey e adiciona source/apiKeyId em Appointment.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasApiKey = await knex.schema.hasTable('ApiKey');
  if (!hasApiKey) {
    await knex.schema.createTable('ApiKey', (table) => {
      table.string('id').primary();
      table.string('tenantId').notNullable();
      table.string('name').notNullable();
      table.string('keyHash').notNullable().unique();
      table.string('prefix').notNullable();
      table.specificType('allowedOrigins', 'text[]').notNullable().defaultTo('{}');
      table.timestamp('lastUsedAt');
      table.timestamp('revokedAt');
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.foreign('tenantId').references('id').inTable('Tenant');
      table.index(['tenantId'], 'ApiKey_tenantId_idx');
    });
  }
  const hasSource = await knex.schema.hasColumn('Appointment', 'source');
  if (!hasSource) {
    await knex.schema.alterTable('Appointment', (table) => {
      table.string('source').notNullable().defaultTo('INTERNAL');
      table.string('apiKeyId').nullable();
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const hasSource = await knex.schema.hasColumn('Appointment', 'source');
  if (hasSource) {
    await knex.schema.alterTable('Appointment', (table) => {
      table.dropColumn('source');
      table.dropColumn('apiKeyId');
    });
  }
  await knex.schema.dropTableIfExists('ApiKey');
};
```

- [ ] **Step 2: Commit**

```bash
git add migrations/20260617121000_add_api_keys_and_source.js
git commit -m "feat(migration): tabela ApiKey + source/apiKeyId em Appointment"
```

> **Nota de execução (reset do banco):** quando houver um Postgres de dev disponível, rodar `npm run knex:migrate:latest` (ou `prisma migrate reset` equivalente do projeto via Knex: `npm run knex:migrate:rollback --all` seguido de `npm run migrate`). Como o ambiente atual não tem DB conectado, as migrations são validadas por revisão de código; a execução real acontece no ambiente com `DATABASE_URL`.

---

## Task 4: Tipo JwtPayload + decorator @CurrentUser

**Files:**
- Create: `src/common/auth/jwt-payload.type.ts`
- Create: `src/common/auth/current-user.decorator.ts`
- Test: `src/common/auth/current-user.decorator.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { ExecutionContext } from '@nestjs/common';
import { extractCurrentUser } from './current-user.decorator';

function ctxWithUser(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

describe('extractCurrentUser', () => {
  it('retorna o user do request', () => {
    const user = { sub: 'u1', email: 'a@b.com', role: 'ADMIN', tenantId: 't1' };
    expect(extractCurrentUser(undefined, ctxWithUser(user))).toEqual(user);
  });

  it('retorna undefined quando não há user', () => {
    expect(extractCurrentUser(undefined, ctxWithUser(undefined))).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- current-user.decorator.spec.ts`
Expected: FAIL ("Cannot find module './current-user.decorator'").

- [ ] **Step 3: Implementar o tipo e o decorator**

`src/common/auth/jwt-payload.type.ts`:
```ts
export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
};
```

`src/common/auth/current-user.decorator.ts`:
```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.type';

export function extractCurrentUser(_data: unknown, ctx: ExecutionContext): JwtPayload | undefined {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
}

export const CurrentUser = createParamDecorator(extractCurrentUser);
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- current-user.decorator.spec.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/common/auth/jwt-payload.type.ts src/common/auth/current-user.decorator.ts src/common/auth/current-user.decorator.spec.ts
git commit -m "feat(auth): JwtPayload com tenantId + decorator @CurrentUser"
```

---

## Task 5: Tenants repository + service + module

**Files:**
- Create: `src/tenants/repositories/tenants.repository.interface.ts`
- Create: `src/tenants/repositories/tenants.repository.ts`
- Create: `src/tenants/tenants.service.ts`
- Create: `src/tenants/dto/create-tenant.dto.ts`
- Create: `src/tenants/tenants.controller.ts`
- Create: `src/tenants/tenants.module.ts`
- Test: `src/tenants/tenants.service.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

const mockRepo = {
  findBySlug: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
};

function makeService() {
  return new TenantsService(mockRepo as any);
}

describe('TenantsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cria tenant com slug normalizado', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: 't1', slug: 'dra-herlania' });
    const svc = makeService();
    await svc.create({ name: 'Dra Herlânia', slug: 'Dra Herlânia' });
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'dra-herlania' }),
    );
  });

  it('rejeita slug duplicado', async () => {
    mockRepo.findBySlug.mockResolvedValue({ id: 't0' });
    const svc = makeService();
    await expect(svc.create({ name: 'X', slug: 'dra-herlania' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejeita nome vazio', async () => {
    const svc = makeService();
    await expect(svc.create({ name: '  ', slug: 'x' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resolveBySlug lança NotFound quando inexistente', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);
    const svc = makeService();
    await expect(svc.resolveBySlug('nada')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolveBySlug retorna o tenant ativo', async () => {
    mockRepo.findBySlug.mockResolvedValue({ id: 't1', isActive: true });
    const svc = makeService();
    expect(await svc.resolveBySlug('dra-herlania')).toMatchObject({ id: 't1' });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- tenants.service.spec.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

`src/tenants/repositories/tenants.repository.interface.ts`:
```ts
import { Tenant } from '@prisma/client';

export const TENANTS_REPOSITORY = Symbol('TENANTS_REPOSITORY');

export interface ITenantsRepository {
  findBySlug(slug: string): Promise<Tenant | null>;
  findById(id: string): Promise<Tenant | null>;
  create(data: { name: string; slug: string }): Promise<Tenant>;
  list(): Promise<Tenant[]>;
}
```

`src/tenants/repositories/tenants.repository.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ITenantsRepository } from './tenants.repository.interface';

@Injectable()
export class TenantsRepository implements ITenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  create(data: { name: string; slug: string }): Promise<Tenant> {
    return this.prisma.tenant.create({ data });
  }

  list(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
```

`src/tenants/dto/create-tenant.dto.ts`:
```ts
export class CreateTenantDto {
  name!: string;
  slug!: string;
}
```

`src/tenants/tenants.service.ts`:
```ts
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ITenantsRepository, TENANTS_REPOSITORY } from './repositories/tenants.repository.interface';

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class TenantsService {
  constructor(
    @Inject(TENANTS_REPOSITORY) private readonly tenantsRepository: ITenantsRepository,
  ) {}

  async create(data: CreateTenantDto) {
    if (!data.name?.trim()) throw new BadRequestException('Nome é obrigatório');
    const slug = slugify(data.slug || data.name);
    if (!slug) throw new BadRequestException('Slug inválido');
    const existing = await this.tenantsRepository.findBySlug(slug);
    if (existing) throw new ConflictException('Slug já em uso');
    return this.tenantsRepository.create({ name: data.name.trim(), slug });
  }

  async resolveBySlug(slug: string) {
    const tenant = await this.tenantsRepository.findBySlug(slug);
    if (!tenant) throw new NotFoundException('Compania não encontrada');
    return tenant;
  }

  list() {
    return this.tenantsRepository.list();
  }
}
```

`src/tenants/tenants.controller.ts`:
```ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('api/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() body: CreateTenantDto) {
    return this.tenantsService.create(body);
  }

  @Get()
  list() {
    return this.tenantsService.list();
  }
}
```

`src/tenants/tenants.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './repositories/tenants.repository';
import { TENANTS_REPOSITORY } from './repositories/tenants.repository.interface';

@Module({
  imports: [PrismaModule],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    { provide: TENANTS_REPOSITORY, useClass: TenantsRepository },
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
```

> Verificar o caminho real do `PrismaModule`/`PrismaService` (em `src/prisma/`). Se o projeto expõe Prisma de outra forma, seguir o padrão existente dos outros módulos.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- tenants.service.spec.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Registrar no app.module.ts e commitar**

Adicionar `TenantsModule` aos imports de `src/app.module.ts`.

```bash
git add src/tenants src/app.module.ts
git commit -m "feat(tenants): modulo de companias com slug + resolveBySlug"
```

---

## Task 6: AuthService — JWT com tenantId + bootstrap cria tenant

**Files:**
- Modify: `src/auth/auth.service.ts`
- Modify: `src/auth/auth.module.ts` (importar TenantsModule)
- Test: `src/auth/auth.service.spec.ts` (criar se não existir)

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { AuthService } from './auth.service';

const mockUsers = {
  findByEmail: jest.fn(),
  countAll: jest.fn(),
  create: jest.fn(),
};
const mockJwt = { signAsync: jest.fn() };
const mockTenants = { create: jest.fn() };

function makeService() {
  return new AuthService(mockUsers as any, mockJwt as any, mockTenants as any);
}

describe('AuthService — tenantId no token', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inclui tenantId no payload do JWT', async () => {
    mockUsers.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: 'ADMIN',
      tenantId: 't1',
      isActive: true,
      password: '$2a$10$abcdefghijklmnopqrstuv', // hash fake começando com $2
    });
    // compareSync precisa retornar true: usar senha que bata — mockar bcrypt
    jest.spyOn(require('bcryptjs'), 'compareSync').mockReturnValue(true);
    mockJwt.signAsync.mockResolvedValue('tok');
    const svc = makeService();
    await svc.login('a@b.com', 'senha');
    expect(mockJwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'u1', tenantId: 't1' }),
    );
  });

  it('bootstrapMaster cria um tenant e associa o user', async () => {
    mockUsers.countAll.mockResolvedValue(0);
    mockTenants.create.mockResolvedValue({ id: 't-new' });
    mockUsers.create.mockResolvedValue({ id: 'u1', email: 'm@c.com', role: 'MASTER' });
    const svc = makeService();
    await svc.bootstrapMaster({ name: 'M', email: 'm@c.com', password: 'senha123' });
    expect(mockTenants.create).toHaveBeenCalled();
    expect(mockUsers.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't-new' }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- auth.service.spec.ts`
Expected: FAIL (construtor não aceita TenantsService / payload sem tenantId).

- [ ] **Step 3: Implementar mudanças no AuthService**

Injetar `TenantsService` no construtor. No `login`, adicionar `tenantId: user.tenantId` ao objeto assinado. No `bootstrapMaster`, antes de criar o user:

```ts
const tenant = await this.tenantsService.create({ name: body.name, slug: body.name });
const user = await this.usersRepository.create({
  name: body.name,
  email: body.email,
  password: hashSync(body.password, 10),
  role: UserRole.MASTER,
  tenantId: tenant.id,
});
```

Atualizar a assinatura do `IUsersRepository.create` e da `UsersRepository.create` para aceitar `tenantId: string`. Atualizar também `UsersService.create` para receber/propagar `tenantId` (o MASTER que cria usuários passa o seu próprio `tenantId`). Adicionar `tenantId` ao payload do `signAsync` no login.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- auth.service.spec.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Importar TenantsModule no AuthModule e commitar**

```bash
git add src/auth src/users
git commit -m "feat(auth): tenantId no JWT + bootstrap cria compania"
```

---

## Task 7: PatientsRepository tenant-aware (teste-chave do bug)

**Files:**
- Modify: `src/patients/repositories/patients.repository.interface.ts`
- Modify: `src/patients/repositories/patients.repository.ts`
- Test: `src/patients/repositories/patients.repository.spec.ts`

- [ ] **Step 1: Escrever o teste que falha (isolamento)**

```ts
import { PatientsRepository } from './patients.repository';

const mockPrisma = {
  patient: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  },
};

function makeRepo() {
  return new PatientsRepository(mockPrisma as any);
}

describe('PatientsRepository — isolamento por tenant', () => {
  beforeEach(() => jest.clearAllMocks());

  it('findAll filtra SEMPRE por tenantId', async () => {
    const repo = makeRepo();
    await repo.findAll('t1');
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
    );
  });

  it('findAll com busca combina q E tenantId', async () => {
    const repo = makeRepo();
    await repo.findAll('t1', 'maria');
    const arg = mockPrisma.patient.findMany.mock.calls[0][0];
    expect(arg.where.tenantId).toBe('t1');
    expect(arg.where.OR).toBeDefined();
  });

  it('findByCpfAndTenant usa cpf + tenantId', async () => {
    const repo = makeRepo();
    await repo.findByCpfAndTenant('123', 't1');
    expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cpf_tenantId: { cpf: '123', tenantId: 't1' } }),
      }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- patients.repository.spec.ts`
Expected: FAIL (assinatura antiga sem tenantId).

- [ ] **Step 3: Implementar**

Interface:
```ts
export interface IPatientsRepository {
  findAll(tenantId: string, q?: string): Promise<Patient[]>;
  findById(id: string, tenantId: string): Promise<Patient | null>;
  findByCpfAndTenant(cpf: string, tenantId: string): Promise<Patient | null>;
  create(data: Prisma.PatientCreateInput): Promise<Patient>;
}
```

Repository:
```ts
findAll(tenantId: string, q?: string): Promise<Patient[]> {
  const where: Prisma.PatientWhereInput = { tenantId };
  if (q) where.OR = [{ name: { contains: q } }, { cpf: { contains: q } }];
  return this.prisma.patient.findMany({ where });
}

findById(id: string, tenantId: string): Promise<Patient | null> {
  return this.prisma.patient.findFirst({ where: { id, tenantId } });
}

findByCpfAndTenant(cpf: string, tenantId: string): Promise<Patient | null> {
  return this.prisma.patient.findUnique({ where: { cpf_tenantId: { cpf, tenantId } } });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- patients.repository.spec.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Atualizar PatientsService/Controller**

`PatientsService`: `list(tenantId, q)`, `profile(id, tenantId)`, `timeline(id, tenantId)` propagando para os repos (incluindo `appointmentsRepository.findByPatient` e `medicalRecordsRepository.findByPatient` — ver Task 8 para a assinatura de appointments). `PatientsController`: usar `@CurrentUser() user` e passar `user.tenantId`.

- [ ] **Step 6: Commit**

```bash
git add src/patients
git commit -m "feat(patients): isolamento por tenant (corrige vazamento)"
```

---

## Task 8: AppointmentsRepository tenant-aware

**Files:**
- Modify: `src/appointments/repositories/appointments.repository.interface.ts`
- Modify: `src/appointments/repositories/appointments.repository.ts`
- Test: `src/appointments/repositories/appointments.repository.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { AppointmentsRepository } from './appointments.repository';

const mockPrisma = {
  appointment: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
  },
};
function makeRepo() {
  return new AppointmentsRepository(mockPrisma as any);
}

describe('AppointmentsRepository — isolamento por tenant', () => {
  beforeEach(() => jest.clearAllMocks());

  it('findByDateWithRelations filtra por tenantId', async () => {
    await makeRepo().findByDateWithRelations('2026-06-17', 't1');
    expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1', date: '2026-06-17' }) }),
    );
  });

  it('findByDateRange filtra por tenantId', async () => {
    await makeRepo().findByDateRange('2026-06-01', '2026-06-30', 't1');
    const arg = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(arg.where.tenantId).toBe('t1');
  });

  it('findByServiceAndDate filtra por tenantId', async () => {
    await makeRepo().findByServiceAndDate('s1', '2026-06-17', 't1');
    const arg = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(arg.where.tenantId).toBe('t1');
  });

  it('findByPatient filtra por tenantId', async () => {
    await makeRepo().findByPatient('p1', 't1');
    const arg = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(arg.where.tenantId).toBe('t1');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- appointments.repository.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Adicionar `tenantId: string` como parâmetro em `findByDateWithRelations`, `findByDateRange`, `findByServiceAndDate`, `findByPatient`, e incluir `tenantId` no `where`. Atualizar a interface correspondente. O `create` recebe os dados já com `tenantId`/`source`/`apiKeyId` via `Prisma.AppointmentCreateInput`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- appointments.repository.spec.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Atualizar AppointmentsService/Controller**

`AppointmentsService.findByDateRange(from, to, tenantId)` e `listByDate(date, tenantId)`. Controller usa `@CurrentUser()`.

- [ ] **Step 6: Commit**

```bash
git add src/appointments
git commit -m "feat(appointments): isolamento por tenant"
```

---

## Task 9: Clinic-config repositories tenant-aware (schedules, services, form-settings)

**Files:**
- Modify: `src/clinic-config/repositories/schedules.repository.ts` + interface
- Modify: `src/clinic-config/repositories/services.repository.ts` + interface
- Modify: `src/clinic-config/repositories/form-settings.repository.ts` + interface
- Test: `src/clinic-config/repositories/clinic-config.repositories.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { SchedulesRepository } from './schedules.repository';
import { ServicesRepository } from './services.repository';
import { FormSettingsRepository } from './form-settings.repository';

const tx = { schedule: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) } };
const mockPrisma: any = {
  schedule: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
  service: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn() },
  formSetting: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
  $transaction: jest.fn(async (cb: any) => cb(tx)),
};

beforeEach(() => jest.clearAllMocks());

describe('Clinic-config repositories — isolamento por tenant', () => {
  it('SchedulesRepository.findAll filtra por tenantId', async () => {
    await new SchedulesRepository(mockPrisma).findAll('t1');
    expect(mockPrisma.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' } }),
    );
  });

  it('SchedulesRepository.replaceAll só apaga horários do tenant', async () => {
    await new SchedulesRepository(mockPrisma).replaceAll([], 't1');
    expect(tx.schedule.deleteMany).toHaveBeenCalledWith({ where: { tenantId: 't1' } });
  });

  it('ServicesRepository.findActive filtra por tenantId', async () => {
    await new ServicesRepository(mockPrisma).findActive('t1');
    expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true, tenantId: 't1' } }),
    );
  });

  it('FormSettingsRepository.findLatest filtra por tenantId', async () => {
    await new FormSettingsRepository(mockPrisma).findLatest('t1');
    expect(mockPrisma.formSetting.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' } }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- clinic-config.repositories.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `SchedulesRepository`: `create(data, tenantId)` injeta `tenantId`; `findAll(tenantId)` e `findByWeekDay(weekDay, tenantId)` filtram; `replaceAll(schedules, tenantId)` usa `deleteMany({ where: { tenantId } })` e `createMany` com `tenantId` em cada item.
- `ServicesRepository`: `create(data, tenantId)`, `findActive(tenantId)` filtra, `update(id, data, tenantId)` valida via `updateMany({ where: { id, tenantId } })` ou `findFirst` antes.
- `FormSettingsRepository`: `create(fields, tenantId)`, `findLatest(tenantId)` filtra.
- Atualizar as 3 interfaces.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- clinic-config.repositories.spec.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Atualizar ClinicConfigService/Controller + PatientAppointmentsService**

Todos os métodos do `ClinicConfigService` recebem `tenantId` e propagam. Controller usa `@CurrentUser()`. `PatientAppointmentsService.getAvailableSchedules`/`createAppointment`/`listActiveServices`/`getFormSettings` recebem `tenantId` (vindo do slug — Task 11). No `createAppointment`, o `patient.findUnique`/`create` usa `cpf_tenantId` e injeta `tenantId`; o `appointment.create` injeta `tenantId` e `source`.

- [ ] **Step 6: Commit**

```bash
git add src/clinic-config src/patient-appointments
git commit -m "feat(clinic-config): isolamento por tenant em horarios, servicos e anamnese"
```

---

## Task 10: WhatsApp config + Notifications tenant-aware

**Files:**
- Modify: `src/whatsapp/whatsapp-config.repository.ts`
- Modify: `src/notifications/notifications.service.ts`
- Test: `src/notifications/notifications.service.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { NotificationsService } from './notifications.service';

const mockPrisma: any = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};
function makeService() {
  return new NotificationsService(mockPrisma);
}

describe('NotificationsService — isolamento por tenant', () => {
  beforeEach(() => jest.clearAllMocks());

  it('create injeta tenantId', async () => {
    await makeService().create({ type: 'X', title: 't', message: 'm', tenantId: 't1' });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: 't1' }) }),
    );
  });

  it('listUnread filtra por tenantId', async () => {
    await makeService().listUnread('t1');
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ readAt: null, tenantId: 't1' }) }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- notifications.service.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`NotificationsService`: `create(data & { tenantId })` injeta tenantId; `listUnread(tenantId)`, `listRecent(tenantId)`, `markAsRead(id, tenantId)` (via updateMany com where id+tenantId), `markAllAsRead(tenantId)` filtram. `WhatsAppConfigRepository`: `findActive(tenantId)`, `findFirst(tenantId)`, `upsert(data, tenantId)` injeta tenantId. Atualizar chamadas no `PatientAppointmentsService` (passa o tenantId ao notificar) e nos controllers de notificação/whatsapp (via `@CurrentUser()`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- notifications.service.spec.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/notifications src/whatsapp src/patient-appointments
git commit -m "feat(notifications,whatsapp): isolamento por tenant"
```

---

## Task 11: Booking público por slug

**Files:**
- Modify: `src/patient-appointments/patient-appointments.controller.ts`
- Modify: `src/patient-appointments/patient-appointments.module.ts` (importar TenantsModule)
- Test: `src/patient-appointments/patient-appointments.controller.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { PatientAppointmentsController } from './patient-appointments.controller';

const mockService = {
  listActiveServices: jest.fn().mockResolvedValue([]),
  getFormSettings: jest.fn().mockResolvedValue(null),
  getAvailableSchedules: jest.fn().mockResolvedValue([]),
  createAppointment: jest.fn().mockResolvedValue({ id: 'a1' }),
};
const mockTenants = { resolveBySlug: jest.fn().mockResolvedValue({ id: 't1', slug: 'dra-herlania' }) };

function makeController() {
  return new PatientAppointmentsController(mockService as any, mockTenants as any);
}

describe('PatientAppointmentsController — booking por slug', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolve o tenant pelo slug antes de listar serviços', async () => {
    await makeController().listServices('dra-herlania');
    expect(mockTenants.resolveBySlug).toHaveBeenCalledWith('dra-herlania');
    expect(mockService.listActiveServices).toHaveBeenCalledWith('t1');
  });

  it('cria agendamento no tenant do slug com source PUBLIC', async () => {
    const dto: any = { name: 'A', cpf: '1', email: 'a@b.com', phone: '9', serviceId: 's1', date: '2026-06-18', time: '09:00', anamnesisAnswers: {} };
    await makeController().create('dra-herlania', dto);
    expect(mockService.createAppointment).toHaveBeenCalledWith('t1', dto, 'PUBLIC');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- patient-appointments.controller.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Injetar `TenantsService`. Rotas passam a usar `:slug`:
```ts
@Controller('api/public/:slug')
export class PatientAppointmentsController {
  constructor(
    private readonly service: PatientAppointmentsService,
    private readonly tenants: TenantsService,
  ) {}

  @Get('services')
  async listServices(@Param('slug') slug: string) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.service.listActiveServices(tenant.id);
  }

  @Get('form-settings')
  async formSettings(@Param('slug') slug: string) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.service.getFormSettings(tenant.id);
  }

  @Get('availability')
  async availability(@Param('slug') slug: string, @Query('serviceId') serviceId: string, @Query('date') date: string) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.service.getAvailableSchedules(tenant.id, serviceId, date);
  }

  @Post('appointments')
  async create(@Param('slug') slug: string, @Body() body: CreateAppointmentDto) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.service.createAppointment(tenant.id, body, 'PUBLIC');
  }
}
```

`createAppointment(tenantId, payload, source)` injeta `tenantId`/`source` no patient e appointment, e passa `tenantId` ao notificar.

> **Atenção ao contrato com o frontend:** as rotas públicas mudaram de path. O Plano 2 (frontend) deve apontar para `/api/public/:slug/...`. Registrar isso como dependência entre planos.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- patient-appointments.controller.spec.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/patient-appointments
git commit -m "feat(booking): agendamento publico isolado por slug da compania"
```

---

## Task 12: ApiKey repository + service (geração e revogação)

**Files:**
- Create: `src/api-keys/repositories/api-keys.repository.interface.ts` + `.ts`
- Create: `src/api-keys/api-keys.service.ts`
- Create: `src/api-keys/api-keys.controller.ts`
- Create: `src/api-keys/api-keys.module.ts`
- Test: `src/api-keys/api-keys.service.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { ApiKeysService } from './api-keys.service';
import * as crypto from 'crypto';

const mockRepo = {
  create: jest.fn(),
  listByTenant: jest.fn().mockResolvedValue([]),
  findByHash: jest.fn(),
  revoke: jest.fn(),
  touch: jest.fn(),
};
function makeService() {
  return new ApiKeysService(mockRepo as any);
}

describe('ApiKeysService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gera chave, guarda hash e retorna a chave em claro uma vez', async () => {
    mockRepo.create.mockResolvedValue({ id: 'k1', prefix: 'abcd1234' });
    const result = await makeService().create('t1', { name: 'Site', allowedOrigins: [] });
    // a chave em claro está no resultado
    expect(result.plaintextKey).toMatch(/^sk_/);
    // o repo recebeu um hash, não a chave em claro
    const dataArg = mockRepo.create.mock.calls[0][0];
    expect(dataArg.keyHash).toBeDefined();
    expect(dataArg.keyHash).not.toContain(result.plaintextKey);
    expect(dataArg.tenantId).toBe('t1');
  });

  it('valida uma chave correta retornando o tenant', async () => {
    const key = 'sk_teste123';
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    mockRepo.findByHash.mockResolvedValue({ id: 'k1', tenantId: 't1', revokedAt: null, allowedOrigins: [] });
    const found = await makeService().validate(key);
    expect(mockRepo.findByHash).toHaveBeenCalledWith(hash);
    expect(found).toMatchObject({ tenantId: 't1' });
  });

  it('rejeita chave revogada', async () => {
    mockRepo.findByHash.mockResolvedValue({ id: 'k1', tenantId: 't1', revokedAt: new Date() });
    expect(await makeService().validate('sk_x')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- api-keys.service.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`ApiKeysService`:
```ts
import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { API_KEYS_REPOSITORY, IApiKeysRepository } from './repositories/api-keys.repository.interface';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(@Inject(API_KEYS_REPOSITORY) private readonly repo: IApiKeysRepository) {}

  async create(tenantId: string, data: { name: string; allowedOrigins: string[] }) {
    const plaintextKey = 'sk_' + crypto.randomBytes(24).toString('hex');
    const keyHash = hashKey(plaintextKey);
    const prefix = plaintextKey.slice(3, 11);
    const record = await this.repo.create({
      tenantId,
      name: data.name,
      keyHash,
      prefix,
      allowedOrigins: data.allowedOrigins ?? [],
    });
    return { ...record, plaintextKey };
  }

  list(tenantId: string) {
    return this.repo.listByTenant(tenantId);
  }

  async validate(key: string) {
    const record = await this.repo.findByHash(hashKey(key));
    if (!record || record.revokedAt) return null;
    this.repo.touch(record.id).catch(() => {});
    return record;
  }

  revoke(id: string, tenantId: string) {
    return this.repo.revoke(id, tenantId);
  }
}
```

Repository com `create`, `listByTenant` (sem `keyHash` no select), `findByHash`, `revoke(id, tenantId)` (via updateMany where id+tenantId set revokedAt), `touch(id)` (set lastUsedAt). Controller protegido `@Roles('MASTER','ADMIN')` com `POST /api/api-keys`, `GET /api/api-keys`, `DELETE /api/api-keys/:id`, usando `@CurrentUser()`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- api-keys.service.spec.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Registrar módulo e commitar**

```bash
git add src/api-keys src/app.module.ts
git commit -m "feat(api-keys): geracao/validacao/revogacao de chaves por compania"
```

---

## Task 13: ApiKeyGuard + módulo de integração externa

**Files:**
- Create: `src/common/auth/api-key.guard.ts`
- Create: `src/integrations/integrations.controller.ts`
- Create: `src/integrations/integrations.module.ts`
- Test: `src/common/auth/api-key.guard.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

const mockApiKeys = { validate: jest.fn() };

function ctx(headers: Record<string, string>) {
  const req: any = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as any;
}

function makeGuard() {
  return new ApiKeyGuard(mockApiKeys as any);
}

describe('ApiKeyGuard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejeita quando falta X-Api-Key', async () => {
    await expect(makeGuard().canActivate(ctx({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita chave inválida', async () => {
    mockApiKeys.validate.mockResolvedValue(null);
    await expect(makeGuard().canActivate(ctx({ 'x-api-key': 'sk_x' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita chave válida e injeta tenantId no request', async () => {
    mockApiKeys.validate.mockResolvedValue({ tenantId: 't1', allowedOrigins: [] });
    const c = ctx({ 'x-api-key': 'sk_ok' });
    const ok = await makeGuard().canActivate(c);
    expect(ok).toBe(true);
    expect(c._req.tenantId).toBe('t1');
  });

  it('bloqueia Origin fora de allowedOrigins', async () => {
    mockApiKeys.validate.mockResolvedValue({ tenantId: 't1', allowedOrigins: ['https://herlania.com'] });
    await expect(
      makeGuard().canActivate(ctx({ 'x-api-key': 'sk_ok', origin: 'https://evil.com' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- api-key.guard.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar o guard**

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'] as string | undefined;
    if (!key) throw new UnauthorizedException('Missing X-Api-Key');

    const record = await this.apiKeys.validate(key);
    if (!record) throw new UnauthorizedException('Invalid API key');

    const origin = (req.headers['origin'] || req.headers['referer']) as string | undefined;
    if (record.allowedOrigins?.length && origin) {
      const allowed = record.allowedOrigins.some((o: string) => origin.startsWith(o));
      if (!allowed) throw new UnauthorizedException('Origin not allowed');
    }

    req.tenantId = record.tenantId;
    req.apiKeyId = record.id;
    return true;
  }
}
```

Controller de integração:
```ts
@Controller('api/integrations')
@UseGuards(ApiKeyGuard)
export class IntegrationsController {
  constructor(
    private readonly appointments: PatientAppointmentsService,
  ) {}

  @Get('services')
  services(@Req() req: any) {
    return this.appointments.listActiveServices(req.tenantId);
  }

  @Get('form-settings')
  formSettings(@Req() req: any) {
    return this.appointments.getFormSettings(req.tenantId);
  }

  @Get('availability')
  availability(@Req() req: any, @Query('serviceId') serviceId: string, @Query('date') date: string) {
    return this.appointments.getAvailableSchedules(req.tenantId, serviceId, date);
  }

  @Post('appointments')
  create(@Req() req: any, @Body() body: CreateAppointmentDto) {
    return this.appointments.createAppointment(req.tenantId, body, 'INTEGRATION', req.apiKeyId);
  }
}
```

`createAppointment(tenantId, payload, source, apiKeyId?)` — estende a assinatura da Task 11 com `apiKeyId` opcional, gravado no appointment. Validar que `serviceId` pertence ao tenant (o `getAvailableSchedules`/repos já filtram por tenant; no create, buscar o service via `servicesRepository.findActive(tenantId)` e rejeitar se o `serviceId` não estiver na lista).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- api-key.guard.spec.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Registrar módulo e commitar**

```bash
git add src/common/auth/api-key.guard.ts src/integrations src/app.module.ts
git commit -m "feat(integrations): API externa por API Key com atribuicao de tenant"
```

---

## Task 14: Dashboard backend (agregações por tenant + origem)

**Files:**
- Create: `src/dashboard/dashboard.service.ts`
- Create: `src/dashboard/dashboard.controller.ts`
- Create: `src/dashboard/dashboard.module.ts`
- Test: `src/dashboard/dashboard.service.spec.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { DashboardService } from './dashboard.service';

const mockPrisma: any = {
  appointment: {
    count: jest.fn().mockResolvedValue(5),
    findMany: jest.fn().mockResolvedValue([
      { date: '2026-06-16', source: 'INTERNAL', service: { name: 'Limpeza' } },
      { date: '2026-06-16', source: 'INTEGRATION', service: { name: 'Limpeza' } },
      { date: '2026-06-17', source: 'PUBLIC', service: { name: 'Canal' } },
    ]),
  },
  patient: { count: jest.fn().mockResolvedValue(2) },
};

function makeService() {
  return new DashboardService(mockPrisma);
}

describe('DashboardService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('todas as queries filtram por tenantId', async () => {
    await makeService().summary('t1', '2026-06-01', '2026-06-30');
    expect(mockPrisma.appointment.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
    );
    expect(mockPrisma.patient.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
    );
  });

  it('agrega consultas por dia, serviço e origem', async () => {
    const r = await makeService().summary('t1', '2026-06-01', '2026-06-30');
    expect(r.appointmentsByDay).toEqual(
      expect.arrayContaining([{ date: '2026-06-16', count: 2 }, { date: '2026-06-17', count: 1 }]),
    );
    expect(r.appointmentsByService).toEqual(
      expect.arrayContaining([{ name: 'Limpeza', count: 2 }, { name: 'Canal', count: 1 }]),
    );
    expect(r.appointmentsBySource).toEqual(
      expect.arrayContaining([
        { source: 'INTERNAL', count: 1 },
        { source: 'INTEGRATION', count: 1 },
        { source: 'PUBLIC', count: 1 },
      ]),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- dashboard.service.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string, from: string, to: string) {
    const where = { tenantId, date: { gte: from, lte: to } };
    const [totalAppointments, newPatients, rows] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.appointment.findMany({
        where,
        select: { date: true, source: true, service: { select: { name: true } } },
      }),
    ]);

    const byKey = (arr: any[], key: (r: any) => string) => {
      const map = new Map<string, number>();
      for (const r of arr) map.set(key(r), (map.get(key(r)) ?? 0) + 1);
      return [...map.entries()];
    };

    return {
      totalAppointments,
      newPatients,
      revenue: 0,
      appointmentsByDay: byKey(rows, (r) => r.date).map(([date, count]) => ({ date, count })),
      appointmentsByService: byKey(rows, (r) => r.service?.name ?? '—').map(([name, count]) => ({ name, count })),
      appointmentsBySource: byKey(rows, (r) => r.source).map(([source, count]) => ({ source, count })),
      upcomingToday: 0,
    };
  }
}
```

Controller `GET /api/dashboard?from=&to=` protegido por `JwtAuthGuard`, usando `@CurrentUser()` para o `tenantId`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- dashboard.service.spec.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Registrar módulo e commitar**

```bash
git add src/dashboard src/app.module.ts
git commit -m "feat(dashboard): metricas por tenant com quebra por origem"
```

---

## Task 15: Build + suíte completa verde

- [ ] **Step 1: Rodar a suíte inteira**

Run: `npm test`
Expected: todos os specs PASS (incluindo os pré-existentes).

- [ ] **Step 2: Compilar**

Run: `npm run build`
Expected: `tsc` sem erros. Erros de tipo aqui revelam qualquer repository/service que esqueceu de propagar `tenantId` — corrigir até zerar.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: multi-tenancy backend completo (suite verde + build limpo)"
```

---

## Dependências entre planos

- **Plano 2 (frontend)** depende deste: as rotas públicas mudaram para `/api/public/:slug/...`; o front precisa do `slug` da compania. O dashboard consome `GET /api/dashboard`. A página de integração consome `/api/api-keys`.
- **Reset do banco** acontece no ambiente com `DATABASE_URL` antes do deploy: rodar as migrations Knex (Tasks 2–3) e `prisma db push`/`generate`.
