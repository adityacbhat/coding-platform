import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function addColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Adding frequency and acceptance columns to problems table...');

  await pool.query(`
    ALTER TABLE problems 
    ADD COLUMN IF NOT EXISTS frequency DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS acceptance DOUBLE PRECISION DEFAULT 0
  `);

  console.log('Columns added successfully!');
  await pool.end();
}

addColumns().catch(console.error);
