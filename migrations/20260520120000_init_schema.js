/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('Service'))) {
    await knex.schema.createTable('Service', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.integer('durationMinutes').notNullable();
      table.boolean('isActive').notNullable().defaultTo(true);
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('Schedule'))) {
    await knex.schema.createTable('Schedule', (table) => {
      table.string('id').primary();
      table.integer('weekDay').notNullable();
      table.string('startTime').notNullable();
      table.string('endTime').notNullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('FormSetting'))) {
    await knex.schema.createTable('FormSetting', (table) => {
      table.string('id').primary();
      table.jsonb('fields').notNullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('Patient'))) {
    await knex.schema.createTable('Patient', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('cpf').notNullable().unique();
      table.string('email').notNullable();
      table.string('phone').notNullable();
    });
  }

  if (!(await knex.schema.hasTable('Appointment'))) {
    await knex.schema.createTable('Appointment', (table) => {
      table.string('id').primary();
      table.string('patientId').notNullable();
      table.string('serviceId').notNullable();
      table.string('date').notNullable();
      table.string('time').notNullable();
      table.jsonb('anamnesisAnswers').notNullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

      table
        .foreign('patientId')
        .references('id')
        .inTable('Patient')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');
      table
        .foreign('serviceId')
        .references('id')
        .inTable('Service')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');
    });
  }

  if (!(await knex.schema.hasTable('MedicalRecord'))) {
    await knex.schema.createTable('MedicalRecord', (table) => {
      table.string('id').primary();
      table.string('appointmentId').notNullable();
      table.jsonb('content').notNullable();
      table.integer('version').notNullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

      table
        .foreign('appointmentId')
        .references('id')
        .inTable('Appointment')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');
    });
  }

  if (!(await knex.schema.hasTable('MedicalRecordAttachment'))) {
    await knex.schema.createTable('MedicalRecordAttachment', (table) => {
      table.string('id').primary();
      table.string('medicalRecordId').notNullable();
      table.string('fileUrl').notNullable();
      table.string('category').notNullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

      table
        .foreign('medicalRecordId')
        .references('id')
        .inTable('MedicalRecord')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');
    });
  }

  if (!(await knex.schema.hasTable('SignatureToken'))) {
    await knex.schema.createTable('SignatureToken', (table) => {
      table.string('id').primary();
      table.string('token').notNullable().unique();
      table.string('medicalRecordId').notNullable();
      table.timestamp('usedAt').nullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

      table
        .foreign('medicalRecordId')
        .references('id')
        .inTable('MedicalRecord')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('SignatureToken');
  await knex.schema.dropTableIfExists('MedicalRecordAttachment');
  await knex.schema.dropTableIfExists('MedicalRecord');
  await knex.schema.dropTableIfExists('Appointment');
  await knex.schema.dropTableIfExists('Patient');
  await knex.schema.dropTableIfExists('FormSetting');
  await knex.schema.dropTableIfExists('Schedule');
  await knex.schema.dropTableIfExists('Service');
};
