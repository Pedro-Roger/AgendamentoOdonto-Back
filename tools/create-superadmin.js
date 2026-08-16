/**
 * Provisiona um usuário SUPERADMIN — o papel de administração cross-tenant da Zarko
 * (ver docs/superpowers/specs/2026-08-16-admin-cross-tenant-design.md).
 *
 * Não existe hoje nenhum fluxo de cadastro que crie um usuário sem Compania:
 * `AuthService.bootstrapMaster` só roda com banco vazio e sempre cria Tenant + MASTER;
 * `UsersController.create` sempre atribui um `tenantId` (do criador, ou um novo se DENTISTA).
 * Por isso o primeiro SUPERADMIN precisa deste script, fora de qualquer rota HTTP — expor isso
 * como endpoint aumentaria superfície de ataque sem necessidade real (operação rara, feita
 * manualmente por Pedro).
 *
 * Pré-requisito: a migration `20260816120000_add_superadmin_to_userrole_enum.js` já aplicada
 * (`npm run knex:migrate:latest`) — o valor 'SUPERADMIN' precisa existir no tipo nativo
 * "UserRole" antes deste script rodar (roda fora da transação da migration, então isso já é
 * garantido desde que a migration tenha sido commitada antes).
 *
 * Uso:
 *   node tools/create-superadmin.js --email=pedro@zarko.dev --password=... [--name="Pedro Roger"]
 *   node tools/create-superadmin.js --email=... --password=... --apply   # executa de verdade
 *
 * Dry-run por padrão: só valida e mostra o que seria criado. `--apply` executa contra o banco
 * apontado por DATABASE_URL.
 */
const { hashSync } = require('bcryptjs');
const knex = require('knex');
const config = require('../knexfile.cjs');

const APPLY = process.argv.includes('--apply');

function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const email = arg('email')?.trim().toLowerCase();
  const password = arg('password');
  const name = arg('name')?.trim() || 'Superadmin Zarko';

  if (!email || !password) {
    console.error('Uso: node tools/create-superadmin.js --email=... --password=... [--name=...] [--apply]');
    process.exitCode = 1;
    return;
  }
  if (password.length < 6) {
    console.error('Senha deve ter pelo menos 6 caracteres.');
    process.exitCode = 1;
    return;
  }

  const db = knex(config);
  try {
    const hasSuperadminValue = await db.raw(`
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'UserRole' AND e.enumlabel = 'SUPERADMIN'
      LIMIT 1
    `).then((r) => r.rows.length > 0);

    if (!hasSuperadminValue) {
      console.error(
        "O tipo \"UserRole\" ainda não tem o valor 'SUPERADMIN'. Rode " +
          "`npm run knex:migrate:latest` (migration 20260816120000) antes deste script.",
      );
      process.exitCode = 1;
      return;
    }

    const existing = await db('User').where({ email }).first();
    if (existing) {
      console.error(`Já existe um usuário com o email ${email} (role atual: ${existing.role}).`);
      process.exitCode = 1;
      return;
    }

    console.log('Será criado:');
    console.log(`  - name:     ${name}`);
    console.log(`  - email:    ${email}`);
    console.log('  - role:     SUPERADMIN');
    console.log('  - tenantId: null (sem Compania — é o superadmin da Zarko)');

    if (!APPLY) {
      console.log('\nDry-run. Nada foi alterado. Rode com --apply para executar.');
      return;
    }

    const { randomUUID } = require('crypto');
    const id = randomUUID();
    await db('User').insert({
      id,
      name,
      email,
      password: hashSync(password, 10),
      role: 'SUPERADMIN',
      tenantId: null,
      isActive: true,
      createdAt: db.fn.now(),
      updatedAt: db.fn.now(),
    });

    console.log(`\n✔ SUPERADMIN criado: ${email} (id ${id})`);
  } finally {
    await db.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
