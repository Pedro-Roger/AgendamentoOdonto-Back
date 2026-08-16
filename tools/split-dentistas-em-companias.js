/**
 * Corrige em base já existente o vazamento de agenda entre dentistas.
 *
 * Contexto: até a correção de 2026-08-16, todo usuário criado pelo painel herdava o `tenantId`
 * de quem criou. Resultado: os dentistas caíam todos na mesma Compania do MASTER e enxergavam
 * a mesma agenda. O modelo escolhido é "cada dentista é uma clínica própria", então cada usuário
 * com papel DENTISTA precisa da sua própria Compania.
 *
 * O que este script FAZ:
 *   - encontra todo usuário DENTISTA que divide Compania com outros usuários;
 *   - cria uma Compania para cada um (slug derivado do nome, desambiguado se colidir);
 *   - move só o usuário para a Compania nova, promovendo-o a MASTER dela.
 *
 * A promoção a MASTER acompanha o que o cadastro de usuário faz hoje: o dentista é dono do
 * próprio consultório e precisa de MASTER para cadastrar a recepcionista dele (UsersController
 * exige MASTER). Ele não perde acesso a nada — todo `@Roles` que lista DENTISTA também lista
 * MASTER.
 *
 * O que este script NÃO FAZ (de propósito):
 *   - não move Appointment, Patient, Schedule, Service ou qualquer outro dado. Esses registros
 *     não têm vínculo com profissional no banco (Appointment só tem `tenantId`), então é
 *     impossível saber de qual dentista eles são. Tudo que já existe continua na Compania
 *     original — a do MASTER. Cada dentista movido começa com agenda vazia, e alguém precisa
 *     decidir manualmente o que deve ser reatribuído.
 *
 * Uso:
 *   node tools/split-dentistas-em-companias.js           # dry-run: só mostra o plano
 *   node tools/split-dentistas-em-companias.js --apply   # executa de verdade
 */
const { randomUUID } = require('crypto');
const knex = require('knex');
const config = require('../knexfile.cjs');

const APPLY = process.argv.includes('--apply');

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(db, name) {
  const base = slugify(name) || 'compania';
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await db('Tenant').where({ slug }).first()) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function main() {
  const db = knex(config);
  try {
    const dentistas = await db('User')
      .where({ role: 'DENTISTA' })
      .whereNotNull('tenantId')
      .select('id', 'name', 'email', 'tenantId')
      .orderBy('createdAt', 'asc');

    if (dentistas.length === 0) {
      console.log('Nenhum usuário DENTISTA encontrado. Nada a fazer.');
      return;
    }

    // Só interessa quem divide Compania com alguém — dentista que já está sozinho está correto.
    const plano = [];
    for (const d of dentistas) {
      const [{ count }] = await db('User').where({ tenantId: d.tenantId }).count({ count: '*' });
      if (Number(count) > 1) plano.push(d);
    }

    if (plano.length === 0) {
      console.log('Todos os dentistas já estão em Compania própria. Nada a fazer.');
      return;
    }

    console.log(`${plano.length} dentista(s) dividindo Compania com outros usuários:\n`);
    for (const d of plano) {
      console.log(`  - ${d.name} <${d.email}>  (hoje em ${d.tenantId})`);
    }

    if (!APPLY) {
      console.log('\nCada um ganha Compania própria e vira MASTER dela.');
      console.log('Dry-run. Nada foi alterado. Rode com --apply para executar.');
      console.log('Lembre: agendamentos e pacientes existentes NÃO são movidos.');
      return;
    }

    await db.transaction(async (trx) => {
      for (const d of plano) {
        const slug = await uniqueSlug(trx, d.name);
        // `Tenant.id` é gerado pelo Prisma (cuid), não pelo banco — a coluna não tem default,
        // então o id precisa vir daqui.
        const [tenant] = await trx('Tenant')
          .insert({
            id: randomUUID(),
            name: d.name,
            slug,
            isActive: true,
            createdAt: trx.fn.now(),
            updatedAt: trx.fn.now(),
          })
          .returning('id');
        const tenantId = typeof tenant === 'object' ? tenant.id : tenant;
        await trx('User')
          .where({ id: d.id })
          .update({ tenantId, role: 'MASTER', updatedAt: trx.fn.now() });
        console.log(`  ✔ ${d.name} → Compania "${slug}" (${tenantId}), agora MASTER dela`);
      }
    });

    console.log('\nPronto. Agendamentos e pacientes antigos continuam na Compania original.');
  } finally {
    await db.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
