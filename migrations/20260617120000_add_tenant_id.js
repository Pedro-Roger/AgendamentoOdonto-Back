/**
 * Adiciona tenantId (FK -> Tenant) em todas as entidades de dados, cria índices e troca o
 * unique de Patient.cpf por (cpf, tenantId). Também adiciona `User.tenantId` (nullable, como o
 * schema Prisma já modela — `tenantId String?`), que nenhuma migration anterior criava.
 *
 * Backfill seguro (achado durante preparação de deploy, 2026-08-16): produção já tem dado real
 * (1 Patient, 1 Appointment, 3 User) quando esta migration roda pela primeira vez. Adicionar
 * `tenantId NOT NULL` direto quebraria contra linha existente. Por isso:
 *   1. as colunas entram **nullable** primeiro;
 *   2. garante (idempotente, por slug) um Tenant padrão "Dra. Herlania" (slug `dra-herlania`) —
 *      é o cliente real hoje, único tenant que faz sentido para dado órfão pré-multi-tenant;
 *   3. preenche `tenantId` de toda linha existente (nas 7 tabelas de dado + `User`) com esse
 *      Tenant padrão;
 *   4. só então as 7 tabelas de dado (não `User` — continua opcional, um SUPERADMIN pode ter
 *      `tenantId` null) viram `NOT NULL`.
 *
 * `User.tenantId` fica sempre nullable (bate com o schema), mas os usuários existentes recebem
 * o Tenant padrão de qualquer forma — sem isso, os 3 `User` reais ficariam "sem clínica" depois
 * do deploy: `AuthService.login` até deixaria logar (só pula a checagem de Compania quando
 * `tenantId` é null), mas qualquer rota protegida por `@CurrentTenantUser()` (patients,
 * appointments, etc.) devolveria 403 porque exige `tenantId` não-null para quem não é
 * SUPERADMIN. Como esta migration roda antes de `20260816120000_add_superadmin_to_userrole_enum.js`
 * (o valor 'SUPERADMIN' ainda não existe no enum neste ponto do histórico), nenhum usuário
 * existente pode ser SUPERADMIN aqui — backfill de todo `User` órfão é seguro sem checar role.
 *
 * @param {import('knex').Knex} knex
 */
const TABLES = ['Patient', 'Appointment', 'Schedule', 'Service', 'FormSetting', 'WhatsAppConfig', 'Notification'];
const DEFAULT_TENANT_SLUG = 'dra-herlania';
const DEFAULT_TENANT_NAME = 'Dra. Herlania';

async function ensureDefaultTenant(knex) {
  const existing = await knex('Tenant').where({ slug: DEFAULT_TENANT_SLUG }).first();
  if (existing) return existing.id;

  const id = require('crypto').randomUUID();
  await knex('Tenant').insert({
    id,
    name: DEFAULT_TENANT_NAME,
    slug: DEFAULT_TENANT_SLUG,
    isActive: true,
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });
  return id;
}

exports.up = async function up(knex) {
  // 1. Colunas nullable primeiro (dado órfão existente não pode quebrar aqui).
  for (const t of TABLES) {
    const hasCol = await knex.schema.hasColumn(t, 'tenantId');
    if (!hasCol) {
      await knex.schema.alterTable(t, (table) => {
        table.string('tenantId').nullable();
        table.foreign('tenantId').references('id').inTable('Tenant');
        table.index(['tenantId'], `${t}_tenantId_idx`);
      });
    }
  }

  const hasUserCol = await knex.schema.hasColumn('User', 'tenantId');
  if (!hasUserCol) {
    await knex.schema.alterTable('User', (table) => {
      table.string('tenantId').nullable();
      table.foreign('tenantId').references('id').inTable('Tenant');
      table.index(['tenantId'], 'User_tenantId_idx');
    });
  }

  // 2. Tenant padrão para dado órfão — idempotente, não duplica se a migration rodar de novo
  //    (não deveria, o Knex já rastreia isso em `knex_migrations`, mas o `findBySlug` cobre o
  //    caso de rodar contra um banco onde o Tenant padrão já foi criado por outro caminho).
  const defaultTenantId = await ensureDefaultTenant(knex);

  // 3. Backfill de toda linha existente (produção hoje: 1 Patient, 1 Appointment, 3 User).
  for (const t of TABLES) {
    await knex(t).whereNull('tenantId').update({ tenantId: defaultTenantId });
  }
  await knex('User').whereNull('tenantId').update({ tenantId: defaultTenantId });

  // 4. Só agora NOT NULL nas 7 tabelas de dado (coluna já populada). `ALTER ... SET NOT NULL`
  //    é idempotente no Postgres — não falha se já estiver NOT NULL.
  for (const t of TABLES) {
    await knex.raw(`ALTER TABLE "${t}" ALTER COLUMN "tenantId" SET NOT NULL`);
  }

  // A constraint unique de `cpf` sozinho tem nome diferente dependendo de como a tabela
  // `Patient` foi criada: `Patient_cpf_key` é o padrão do Prisma (`prisma db push`/`migrate
  // dev`), mas em produção a tabela veio da migration Knex `20260520120000_init_schema.js`
  // (`table.string('cpf').unique()`), cujo nome default é `patient_cpf_unique`. Testado
  // localmente (banco simulando produção): `DROP CONSTRAINT IF EXISTS "Patient_cpf_key"`
  // sozinho é um no-op nesse caso — a constraint antiga ficaria viva ao lado da composta nova,
  // impedindo dois tenants diferentes de terem paciente com o mesmo CPF. Busca dinâmica pelo
  // nome real da constraint unique de coluna única `cpf` cobre os dois casos.
  const oldCpfConstraint = await knex.raw(`
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'Patient'
      AND c.contype = 'u'
      AND c.conkey = (
        SELECT array_agg(attnum) FROM pg_attribute
        WHERE attrelid = c.conrelid AND attname = 'cpf'
      )
  `).then((r) => r.rows[0]);

  if (oldCpfConstraint) {
    await knex.raw(`ALTER TABLE "Patient" DROP CONSTRAINT "${oldCpfConstraint.conname}"`);
  }
  await knex.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Patient_cpf_tenantId_key" ON "Patient" ("cpf", "tenantId")`,
  );
};

exports.down = async function down(knex) {
  // Antes de qualquer coisa: recriar UNIQUE(cpf) global só é seguro se não existir CPF repetido
  // entre tenants diferentes hoje — exatamente o cenário que o redesign multi-tenant existe para
  // permitir. Falha cedo com mensagem clara em vez de deixar o Postgres estourar
  // "could not create unique index" no meio do lote de rollback (erro cru, sem contexto,
  // encontrado testando com 2 tenants fake + CPF colidente).
  const duplicateCpfs = await knex.raw(`
    SELECT cpf, COUNT(*)::int AS count
    FROM "Patient"
    WHERE cpf IS NOT NULL
    GROUP BY cpf
    HAVING COUNT(*) > 1
  `);
  if (duplicateCpfs.rows.length > 0) {
    const sample = duplicateCpfs.rows[0];
    throw new Error(
      `Rollback de 20260617120000_add_tenant_id abortado: não é seguro reverter para ` +
        `UNIQUE(cpf) global com dado atual. Encontrado(s) ${duplicateCpfs.rows.length} CPF(s) ` +
        `duplicado(s) entre tenants diferentes (ex.: cpf="${sample.cpf}", ${sample.count} ` +
        `pacientes) — isso é esperado no modelo multi-tenant, mas violaria a constraint antiga. ` +
        `Resolva a colisão manualmente (mesclar ou renomear os pacientes duplicados) antes de ` +
        `rodar o rollback desta migration.`,
    );
  }

  await knex.raw(`DROP INDEX IF EXISTS "Patient_cpf_tenantId_key"`);
  await knex.raw(`ALTER TABLE "Patient" ADD CONSTRAINT "patient_cpf_unique" UNIQUE ("cpf")`);

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

  const hasUserCol = await knex.schema.hasColumn('User', 'tenantId');
  if (hasUserCol) {
    await knex.schema.alterTable('User', (table) => {
      table.dropForeign('tenantId');
      table.dropIndex(['tenantId'], 'User_tenantId_idx');
      table.dropColumn('tenantId');
    });
  }

  // Não apaga o Tenant padrão aqui de propósito: não há como saber, só com o down desta
  // migration, se ele ficou órfão ou já tinha dado real associado por fora do backfill. Fica a
  // cargo do down de `20260617110000_create_tenant_table.js` (que dropa a tabela Tenant inteira)
  // quando o rollback for completo até lá.
};
