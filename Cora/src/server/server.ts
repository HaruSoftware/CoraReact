import express from 'express'
import cors from 'cors'
import { setupDatabase, testDatabaseConnection } from './db.js'
import categoriasRouter from './routes/categorias.js'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.use('/api/categorias', categoriasRouter)

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

app.get('/api/setup-database', async (_req, res) => {
  try {
    await setupDatabase()

    res.json({
      success: true,
      message: 'Banco de dados configurado com sucesso!',
    })
  } catch (error) {
    console.error('Erro ao configurar banco:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao configurar banco de dados.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})