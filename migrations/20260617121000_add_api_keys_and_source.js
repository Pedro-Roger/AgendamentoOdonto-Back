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
