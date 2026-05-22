/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('User', 'isActive');
  if (!hasColumn) {
    await knex.schema.alterTable('User', (table) => {
      table.boolean('isActive').notNullable().defaultTo(true);
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('User', 'isActive');
  if (hasColumn) {
    await knex.schema.alterTable('User', (table) => {
      table.dropColumn('isActive');
    });
  }
};
