import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ quiet: true });

const { Pool } = pg;

const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 5432),
	database: process.env.DB_NAME || 'postgres',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || 'postgres'
});

pool.on('error', (err) => {
	console.error('Unexpected PostgreSQL client error', err);
});

export async function query(text, params = []) {
	return pool.query(text, params);
}

export { pool };
