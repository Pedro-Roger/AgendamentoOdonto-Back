require('dotenv').config();

/** @type { import('knex').Knex.Config } */
module.exports = {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  pool: {
    min: 0,
    max: 10,
  },
};
