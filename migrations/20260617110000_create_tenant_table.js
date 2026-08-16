/**
 * Cria a tabela `Tenant`, batendo com o model `Tenant` em `prisma/schema.prisma`
 * (id, name, slug único, landingPageUrl, logoUrl, phone, isActive default true, createdAt,
 * updatedAt).
 *
 * Precisa rodar antes de `20260617120000_add_tenant_id.js`, que referencia `Tenant` via FK.
 * Achado durante preparação de deploy (2026-08-16): o model `Tenant` existe no schema Prisma
 * desde o redesign multi-tenant, mas **nenhuma migration Knex jamais criou a tabela** — ela só
 * existia em ambientes onde `prisma db push`/`migrate dev` foi rodado manualmente. O pipeline
 * real de deploy (`docker-compose.yml`) só roda `npm run migrate` (Knex + `prisma generate`,
 * nunca `db push`), então produção nunca teve essa tabela. Ver diário do projeto.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('Tenant');
  if (hasTable) return;

  await knex.schema.createTable('Tenant', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.string('landingPageUrl').nullable();
    table.string('logoUrl').nullable();
    table.string('phone').nullable();
    table.boolean('isActive').notNullable().defaultTo(true);
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('Tenant');
};
