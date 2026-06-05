/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.raw(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DENTISTA'`);
  await knex.raw(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RECEPCIONISTA'`);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(_knex) {
  // PostgreSQL does not support removing enum values without recreating the type
};
