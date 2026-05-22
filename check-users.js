const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const { hashSync } = require('bcryptjs');
require('dotenv').config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log('Current users:', users);

  const email = 'rafaela@clinicasorriso.com';
  const existing = users.find(u => u.email === email);
  if (!existing) {
    const newUser = await prisma.user.create({
      data: {
        name: 'Rafaela',
        email: email,
        password: hashSync('password123', 10),
        role: 'MASTER'
      }
    });
    console.log('Created master user:', newUser);
  } else {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashSync('password123', 10)
      }
    });
    console.log('Reset password for user:', updated);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
