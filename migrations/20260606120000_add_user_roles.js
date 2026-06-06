/**
 * Adiciona roles DENTISTA e RECEPCIONISTA ao campo User.role.
 *
 * O Knex criou a coluna role com table.enu() que usa um CHECK constraint
 * (não um tipo nativo PostgreSQL). Esta migration remove o constraint antigo
 * e adiciona um novo permitindo os 4 roles.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // Verifica se existe um tipo nativo "UserRole" (criado por Prisma db push)
  const hasNativeEnum = await knex.raw(`
    SELECT 1 FROM pg_type WHERE typname = 'UserRole' LIMIT 1
  `).then(r => r.rows.length > 0);

  if (hasNativeEnum) {
    await knex.raw(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DENTISTA'`);
    await knex.raw(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RECEPCIONISTA'`);
    return;
  }

  // Busca o nome do CHECK constraint existente na tabela User coluna role
  const constraintRow = await knex.raw(`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = '"User"'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
    LIMIT 1
  `).then(r => r.rows[0]);

  if (constraintRow) {
    await knex.raw(`ALTER TABLE "User" DROP CONSTRAINT "${constraintRow.conname}"`);
  }

  // Adiciona novo constraint com todos os 4 roles
  await knex.raw(`
    ALTER TABLE "User"
    ADD CONSTRAINT "User_role_check"
    CHECK (role IN ('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA'))
  `);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const hasNativeEnum = await knex.raw(`
    SELECT 1 FROM pg_type WHERE typname = 'UserRole' LIMIT 1
  `).then(r => r.rows.length > 0);

  if (hasNativeEnum) return;

  const constraintRow = await knex.raw(`
    SELECT conname FROM pg_constraint
    WHERE conrelid = '"User"'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
    LIMIT 1
  `).then(r => r.rows[0]);

  if (constraintRow) {
    await knex.raw(`ALTER TABLE "User" DROP CONSTRAINT "${constraintRow.conname}"`);
  }

  await knex.raw(`
    ALTER TABLE "User"
    ADD CONSTRAINT "User_role_check"
    CHECK (role IN ('MASTER', 'ADMIN'))
  `);
};
