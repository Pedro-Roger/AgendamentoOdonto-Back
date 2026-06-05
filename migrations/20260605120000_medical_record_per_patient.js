/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('MedicalRecord', (table) => {
    table.string('patientId').nullable();
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('patientId')
      .references('id')
      .inTable('Patient')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
  });

  // Backfill patientId from the linked Appointment
  await knex.raw(`
    UPDATE "MedicalRecord" mr
    SET "patientId" = a."patientId"
    FROM "Appointment" a
    WHERE mr."appointmentId" = a."id"
      AND mr."patientId" IS NULL
  `);

  // Make appointmentId nullable and patientId not null
  await knex.schema.alterTable('MedicalRecord', (table) => {
    table.string('appointmentId').nullable().alter();
  });

  // Only set NOT NULL after backfill
  await knex.raw(`
    ALTER TABLE "MedicalRecord"
    ALTER COLUMN "patientId" SET NOT NULL
  `);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('MedicalRecord', (table) => {
    table.dropForeign('patientId');
    table.dropColumn('patientId');
    table.dropColumn('updatedAt');
    table.string('appointmentId').notNullable().alter();
  });
};
