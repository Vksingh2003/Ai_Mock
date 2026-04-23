require('dotenv').config({ path: '.env.local' });

/** @type { import("drizzle-kit").Config } */
const config = {
  schema: './utils/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.NEXT_PUBLIC_DRIZZLE_DB_URL,
  }
};

module.exports = config;
