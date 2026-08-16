/**
 * Adiciona o valor 'SUPERADMIN' ao tipo nativo PostgreSQL "UserRole".
 *
 * Papel usado pela administração cross-tenant da Zarko (ver
 * docs/superpowers/specs/2026-08-16-admin-cross-tenant-design.md). `User.tenantId` já é
 * opcional no schema — um usuário SUPERADMIN é criado com `tenantId: null` pelo script
 * `tools/create-superadmin.js`, fora desta migration.
 *
 * Importante (mesma disciplina de `20260606300000_create_userrole_enum.js` e
 * `20260606120000_add_user_roles.js`): `ALTER TYPE ... ADD VALUE` não pode ter o valor novo
 * consumido (INSERT/UPDATE/comparação) na mesma transação em que foi adicionado. Esta migration
 * só adiciona o valor — nenhum seed ou script de provisionamento roda aqui. O
 * `create-superadmin.js` só deve rodar depois de `knex migrate:latest` ter sido commitado.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.raw(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN'`);
};

/**
 * Postgres não suporta remover um valor de enum diretamente (exigiria recriar o tipo inteiro
 * e migrar a coluna, arriscado se qualquer linha já usar 'SUPERADMIN'). Rollback é no-op
 * proposital — se for realmente necessário reverter, avaliar manualmente se existe usuário
 * SUPERADMIN antes de recriar o tipo.
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  // eslint-disable-next-line no-unused-vars
  void knex;
};
