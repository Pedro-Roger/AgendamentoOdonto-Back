/**
 * Cria o tipo nativo PostgreSQL "UserRole" que o Prisma requer,
 * e migra a coluna User.role para usar esse tipo.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // Cria o enum nativo se ainda não existe
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // Remove o CHECK constraint antigo (se existir)
  const constraint = await knex.raw(`
    SELECT conname FROM pg_constraint
    WHERE conrelid = '"User"'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
    LIMIT 1
  `).then(r => r.rows[0]);

  if (constraint) {
    await knex.raw(`ALTER TABLE "User" DROP CONSTRAINT "${constraint.conname}"`);
  }

  // Remove o DEFAULT antes de converter (PostgreSQL exige)
  await knex.raw(`ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT`);

  // Altera a coluna para usar o tipo nativo
  await knex.raw(`
    ALTER TABLE "User"
    ALTER COLUMN role TYPE "UserRole"
    USING role::"UserRole"
  `);

  // Restaura o DEFAULT com o novo tipo
  await knex.raw(`ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'ADMIN'::"UserRole"`);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  // Reverte para string com CHECK constraint
  await knex.raw(`
    ALTER TABLE "User"
    ALTER COLUMN role TYPE varchar(255)
  `);

  await knex.raw(`
    ALTER TABLE "User"
    ADD CONSTRAINT "User_role_check"
    CHECK (role IN ('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA'))
  `);

  await knex.raw(`DROP TYPE IF EXISTS "UserRole"`);
};
