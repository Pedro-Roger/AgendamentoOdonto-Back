/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('WhatsAppConfig'))) {
    await knex.schema.createTable('WhatsAppConfig', (table) => {
      table.string('id').primary();
      table.string('instanceId').notNullable();
      table.string('token').notNullable();
      table.string('clinicName').notNullable();
      table.string('clinicAddress').notNullable().defaultTo('');
      table.boolean('isActive').notNullable().defaultTo(true);
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('AppointmentReminder'))) {
    await knex.schema.createTable('AppointmentReminder', (table) => {
      table.string('id').primary();
      table.string('appointmentId').notNullable().unique();
      table.timestamp('sentAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('confirmedAt').nullable();
      table.string('token').notNullable().unique();
      table.foreign('appointmentId').references('id').inTable('Appointment').onDelete('CASCADE');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('AppointmentReminder');
  await knex.schema.dropTableIfExists('WhatsAppConfig');
};
