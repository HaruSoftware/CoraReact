import pg from 'pg'
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'

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

export async function setupDatabase() {
  const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql')
  const schema = await fs.readFile(schemaPath, 'utf-8')

  await pool.query(schema)

  console.log('Banco de dados configurado com sucesso!')
}