import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function testDatabaseConnection() {
  const client = await pool.connect()

  try {
    await client.query('SELECT 1')
    console.log('PostgreSQL conectado com sucesso!')
  } finally {
    client.release()
  }
}