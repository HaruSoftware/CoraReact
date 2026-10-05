import express from 'express'
import cors from 'cors'
import { aplicarMigracoes, setupDatabase, testDatabaseConnection } from './db.js'
import categoriasRouter from './routes/categorias.js'
import contasRouter from './routes/contas.js'
import usuariosRouter from './routes/usuarios.js'
import produtosRouter from './routes/produtos.js'
import clientesRouter from './routes/clientes.js'
import vendasRouter from './routes/vendas.js'
import dashboardRouter from './routes/dashboard.js'
import itensVendaRouter from './routes/itensVenda.js'
import authRouter from './routes/auth.js'
import { autenticar, type AuthRequest } from './middleware/auth.js'  
import googleAuthRouter from './routes/googleAuth.js'
import unidadesMedidaRouter from './routes/unidadesMedida.js'
import planosRouter from './routes/planos.js'
import assinaturasRouter from './routes/assinaturas.js'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import path from 'node:path'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

app.use(cookieParser())
app.use(express.json())
app.use(passport.initialize())

app.use('/api/categorias', categoriasRouter)
app.use('/api/unidades-medida', unidadesMedidaRouter)
app.use('/api/planos', planosRouter)
app.use('/api/assinaturas', assinaturasRouter)
app.use('/api/contas', contasRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/produtos', produtosRouter)
app.use('/api/clientes', clientesRouter)
app.use('/api/vendas', vendasRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/itens-venda', itensVendaRouter)
app.use('/api/auth', authRouter)
app.use('/api/auth', googleAuthRouter)

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

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(process.cwd(), 'dist')

  app.use(express.static(frontendDist))
  app.use((req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path === '/api' ||
      req.path.startsWith('/api/')
    ) {
      return next()
    }

    res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
}

async function iniciarServidor() {
  await aplicarMigracoes()

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
  })
}

iniciarServidor().catch((error: unknown) => {
  console.error('Falha ao iniciar o servidor ou aplicar migrações:', error)
  process.exitCode = 1
})