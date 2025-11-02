import mysql from 'mysql2/promise';

if (!process.env.DB_HOST) {
  throw new Error('Missing DB config in environment variables');
}

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});