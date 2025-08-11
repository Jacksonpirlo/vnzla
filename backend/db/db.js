import pkg from 'pg';
const { Pool } = pkg;

// Configuración de PostgreSQL con datos reales
const db = new Pool({
  host: 'aws-0-us-east-2.pooler.supabase.com',
  user: 'postgres.3lw3b0m103st4pr3nd10
  password: 'password', // remplaza con tu contraseña de Supabase
  database: 'postgres',
  port: 6543,
  ssl: { rejectUnauthorized: false } // Supabase requiere SSL
});

export default db;
