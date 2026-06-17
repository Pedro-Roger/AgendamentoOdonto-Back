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
  await knex.raw(`ALTER TABLE "Patient" DROP CONSTRAINT IF EXISTS "Patient_cpf_key"`);
  await knex.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Patient_cpf_tenantId_key" ON "Patient" ("cpf", "tenantId")`,
  );
};

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
