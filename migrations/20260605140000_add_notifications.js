exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('Notification'))) {
    await knex.schema.createTable('Notification', (table) => {
      table.string('id').primary();
      table.string('type').notNullable();
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.jsonb('data').nullable();
      table.timestamp('readAt').nullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    });
  }
};
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('Notification');
};
