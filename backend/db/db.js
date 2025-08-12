import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

// Configuración de PostgreSQL desde variables de entorno
const db = new Pool({
  host: process.env.PGHOST || 'aws-0-us-east-2.pooler.supabase.com',
  user: process.env.PGUSER || 'postgres.wsuvuakmzpezlmfpqded',
  password: process.env.PGPASSWORD || '1234',
  database: process.env.PGDATABASE || 'postgres',
  port: Number(process.env.PGPORT || 6543),
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
});

export default db;
