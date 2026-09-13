import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

async function garantirUnidadesPadrao(idConta: number) {
  await pool.query(
    `INSERT INTO unidade_medida (id_conta, codigo, nome)
     SELECT $1, unidade.codigo, unidade.nome
     FROM (VALUES
       ('UN', 'Unidade'), ('KG', 'Quilograma'), ('G', 'Grama'),
       ('L', 'Litro'), ('ML', 'Mililitro')
     ) AS unidade(codigo, nome)
     WHERE NOT EXISTS (
       SELECT 1 FROM unidade_medida WHERE id_conta = $1
     )
     ON CONFLICT (id_conta, codigo) DO NOTHING`,
    [idConta]
  )
}

router.get('/', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta
    await garantirUnidadesPadrao(id_conta)

    const result = await pool.query(
      `SELECT id_unidade_medida, id_conta, codigo, nome, ativo, data_cadastro
       FROM unidade_medida
       WHERE id_conta = $1
       ORDER BY ativo DESC, codigo`,
      [id_conta]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar unidades de medida:', error)
    res.status(500).json({ success: false, message: 'Erro ao buscar unidades de medida.' })
  }
})

router.post('/', autenticar, async (req, res) => {
  try {
    const { codigo, nome } = req.body
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta
    const codigoNormalizado = String(codigo || '').trim().toUpperCase()
    const nomeNormalizado = String(nome || '').trim()

    if (!/^[A-Z0-9]{1,10}$/.test(codigoNormalizado) || !nomeNormalizado) {
      return res.status(400).json({ success: false, message: 'Informe um código de até 10 caracteres e um nome.' })
    }

    const result = await pool.query(
      `INSERT INTO unidade_medida (id_conta, codigo, nome)
       VALUES ($1, $2, $3)
       RETURNING id_unidade_medida, id_conta, codigo, nome, ativo, data_cadastro`,
      [id_conta, codigoNormalizado, nomeNormalizado]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar unidade de medida:', error)
    res.status(500).json({ success: false, message: 'Não foi possível criar esta unidade.' })
  }
})

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params
    const { ativo } = req.body
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `UPDATE unidade_medida
       SET ativo = $1
       WHERE id_unidade_medida = $2 AND id_conta = $3
       RETURNING id_unidade_medida, id_conta, codigo, nome, ativo, data_cadastro`,
      [Boolean(ativo), id, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Unidade de medida não encontrada.' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar unidade de medida:', error)
    res.status(500).json({ success: false, message: 'Não foi possível atualizar esta unidade.' })
  }
})

export default router