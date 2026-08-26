import express from 'express'
import cors from 'cors'
import { setupDatabase, testDatabaseConnection } from './db.js'
import categoriasRouter from './routes/categorias.js'
import contasRouter from './routes/contas.js'
import usuariosRouter from './routes/usuarios.js'
import produtosRouter from './routes/produtos.js'
import clientesRouter from './routes/clientes.js'
import vendasRouter from './routes/vendas.js'
import itensVendaRouter from './routes/itensVenda.js'
import authRouter from './routes/auth.js'
import { autenticar, type AuthRequest } from './middleware/auth.js'  

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.use('/api/categorias', categoriasRouter)
app.use('/api/contas', contasRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/produtos', produtosRouter)
app.use('/api/clientes', clientesRouter)
app.use('/api/vendas', vendasRouter)
app.use('/api/itens-venda', itensVendaRouter)
app.use('/api/auth', authRouter)

app.get('/api/auth/me', autenticar, (req, res) => {
    const request = req as AuthRequest

    res.json({
        success: true,
        usuario: request.usuario,
    })
})

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