import express from 'express'
import cors from 'cors'
import { testDatabaseConnection } from './db.js'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await testDatabaseConnection()

    res.json({
      success: true,
      database: 'connected',
    })
  } catch (error) {
    console.error('Erro ao conectar ao banco:', error)

    res.status(500).json({
      success: false,
      database: 'disconnected',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})