require('dotenv').config();

/** @type { import('knex').Knex.Config } */
module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  pool: {
    min: 0,
    max: 10,
  },
};
