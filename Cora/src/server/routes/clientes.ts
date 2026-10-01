import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

type TipoPessoa = 'PF' | 'PJ'

type DadosCliente = {
  nome: string
  tipo_pessoa: TipoPessoa
  documento: string | null
  telefone: string | null
  email: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
}

function normalizarDocumento(tipoPessoa: TipoPessoa, valor: unknown) {
  if (typeof valor !== 'string') return ''
  const texto = valor.trim().toUpperCase()
  if (tipoPessoa === 'PF') {
    return /^[\d.\-\s]*$/.test(texto) ? texto.replace(/\D/g, '') : ''
  }
  return /^[A-Z0-9./\-\s]*$/.test(texto) ? texto.replace(/[^A-Z0-9]/g, '') : ''
}

function validarCpf(documento: string) {
  if (!/^\d{11}$/.test(documento) || /^(\d)\1{10}$/.test(documento)) return false

  const calcularDigito = (base: string, pesoInicial: number) => {
    let soma = 0
    for (let indice = 0; indice < base.length; indice += 1) {
      soma += Number(base[indice]) * (pesoInicial - indice)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return calcularDigito(documento.slice(0, 9), 10) === Number(documento[9])
    && calcularDigito(documento.slice(0, 10), 11) === Number(documento[10])
}

function validarCnpj(documento: string) {
  if (!/^[A-Z0-9]{12}\d{2}$/.test(documento) || /^(.)\1{11}\d{2}$/.test(documento)) return false

  const valores = Array.from(documento.slice(0, 12), (caractere) => caractere.charCodeAt(0) - 48)
  const calcularDigito = (base: number[], pesos: number[]) => {
    const soma = base.reduce((total, valor, indice) => total + valor * pesos[indice], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const primeiroDigito = calcularDigito(valores, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  if (primeiroDigito !== Number(documento[12])) return false

  return calcularDigito(
    [...valores, primeiroDigito],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  ) === Number(documento[13])
}

function textoOpcional(valor: unknown, limite: number): string | null | false {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor !== 'string') return false
  const texto = valor.trim()
  if (!texto) return null
  return texto.length <= limite ? texto : false
}

function validarDadosCliente(body: Record<string, unknown>): { dados?: DadosCliente; erro?: string } {
  const tipoPessoa = body.tipo_pessoa === undefined ? 'PF' : body.tipo_pessoa
  if (tipoPessoa !== 'PF' && tipoPessoa !== 'PJ') return { erro: 'Selecione pessoa física ou jurídica.' }

  const nome = textoOpcional(body.nome, 150)
  if (typeof nome !== 'string') return { erro: 'Informe um nome ou razão social de até 150 caracteres.' }

  const documentoRecebido = textoOpcional(body.documento ?? body.cpf, 18)
  if (documentoRecebido === false) return { erro: 'O documento excede o tamanho permitido.' }
  const documentoNormalizado = typeof documentoRecebido === 'string'
    ? normalizarDocumento(tipoPessoa, documentoRecebido)
    : null
  if (documentoRecebido && !documentoNormalizado) {
    return { erro: tipoPessoa === 'PF' ? 'Informe um CPF válido.' : 'Informe um CNPJ válido.' }
  }
  if (documentoNormalizado) {
    const documentoValido = tipoPessoa === 'PF'
      ? validarCpf(documentoNormalizado)
      : validarCnpj(documentoNormalizado)
    if (!documentoValido) {
      return { erro: tipoPessoa === 'PF' ? 'Informe um CPF válido.' : 'Informe um CNPJ válido.' }
    }
  }

  const telefone = textoOpcional(body.telefone, 20)
  const email = textoOpcional(body.email, 150)
  const logradouro = textoOpcional(body.logradouro, 150)
  const numero = textoOpcional(body.numero, 20)
  const complemento = textoOpcional(body.complemento, 100)
  const bairro = textoOpcional(body.bairro, 100)
  const cidade = textoOpcional(body.cidade, 100)
  if ([telefone, email, logradouro, numero, complemento, bairro, cidade].includes(false)) {
    return { erro: 'Um ou mais campos excedem o tamanho permitido.' }
  }

  const cepRecebido = textoOpcional(body.cep, 10)
  if (typeof cepRecebido === 'string' && !/^[\d.\-\s]+$/.test(cepRecebido)) {
    return { erro: 'Informe um CEP com 8 dígitos.' }
  }
  const cep = typeof cepRecebido === 'string' ? cepRecebido.replace(/\D/g, '') : null
  if (cepRecebido === false || (cep && !/^\d{8}$/.test(cep))) {
    return { erro: 'Informe um CEP com 8 dígitos.' }
  }

  const ufRecebida = textoOpcional(body.uf, 2)
  const uf = typeof ufRecebida === 'string' ? ufRecebida.toUpperCase() : null
  if (ufRecebida === false || (uf && !/^[A-Z]{2}$/.test(uf))) {
    return { erro: 'Informe uma UF válida com 2 letras.' }
  }

  return {
    dados: {
      nome,
      tipo_pessoa: tipoPessoa,
      documento: documentoNormalizado,
      telefone: telefone || null,
      email: email || null,
      cep,
      logradouro: logradouro || null,
      numero: numero || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      uf,
    },
  }
}

function validarDescontoPercentual(valor: unknown) {
  const desconto = Number(valor)
  return Number.isFinite(desconto)
    && desconto >= 0
    && desconto <= 100
    && Math.abs(desconto * 100 - Math.round(desconto * 100)) < 1e-8
}

router.get('/', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
            `SELECT id_cliente, id_conta, nome, tipo_pessoa, documento, telefone, email,
              cep, logradouro, numero, complemento, bairro, cidade, uf,
              desconto_percentual
       FROM cliente
       WHERE id_conta = $1
       ORDER BY id_cliente`,
      [id_conta]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar clientes.',
    })
  }
})

router.post('/', autenticar, async (req, res) => {
  try {
    const validacao = validarDadosCliente(req.body as Record<string, unknown>)
    const desconto_percentual = req.body.desconto_percentual ?? 0

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (!validacao.dados) {
      return res.status(400).json({ success: false, message: validacao.erro })
    }

    if (!validarDescontoPercentual(desconto_percentual)) {
      return res.status(400).json({
        success: false,
        message: 'O desconto do cliente deve estar entre 0% e 100%, com até duas casas decimais.',
      })
    }

    const dados = validacao.dados
    if (dados.documento) {
      const existente = await pool.query(
        'SELECT 1 FROM cliente WHERE id_conta = $1 AND documento = $2 LIMIT 1',
        [id_conta, dados.documento]
      )
      if (existente.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Já existe um cliente com este documento.' })
      }
    }

    const result = await pool.query(
      `INSERT INTO cliente (
        id_conta,
        nome,
        tipo_pessoa,
        documento,
        telefone,
        email,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        desconto_percentual
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id_cliente, id_conta, nome, tipo_pessoa, documento, telefone, email,
                cep, logradouro, numero, complemento, bairro, cidade, uf,
                desconto_percentual`,
      [
        id_conta, dados.nome, dados.tipo_pessoa, dados.documento, dados.telefone,
        dados.email, dados.cep, dados.logradouro, dados.numero, dados.complemento,
        dados.bairro, dados.cidade, dados.uf, Number(desconto_percentual),
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar cliente:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar cliente.',
    })
  }
})

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params
    const validacao = validarDadosCliente(req.body as Record<string, unknown>)
    const desconto_percentual = req.body.desconto_percentual ?? 0

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (!validacao.dados) {
      return res.status(400).json({ success: false, message: validacao.erro })
    }

    if (!validarDescontoPercentual(desconto_percentual)) {
      return res.status(400).json({
        success: false,
        message: 'O desconto do cliente deve estar entre 0% e 100%, com até duas casas decimais.',
      })
    }

    const dados = validacao.dados
    if (dados.documento) {
      const existente = await pool.query(
        `SELECT 1 FROM cliente
         WHERE id_conta = $1 AND documento = $2 AND id_cliente <> $3
         LIMIT 1`,
        [id_conta, dados.documento, id]
      )
      if (existente.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Já existe um cliente com este documento.' })
      }
    }

    const result = await pool.query(
      `UPDATE cliente
       SET nome = $1,
           tipo_pessoa = $2,
           documento = $3,
           telefone = $4,
           email = $5,
           cep = $6,
           logradouro = $7,
           numero = $8,
           complemento = $9,
           bairro = $10,
           cidade = $11,
           uf = $12,
           desconto_percentual = $13
       WHERE id_cliente = $14 AND id_conta = $15
       RETURNING id_cliente, id_conta, nome, tipo_pessoa, documento, telefone, email,
                 cep, logradouro, numero, complemento, bairro, cidade, uf,
                 desconto_percentual`,
      [
        dados.nome, dados.tipo_pessoa, dados.documento, dados.telefone, dados.email,
        dados.cep, dados.logradouro, dados.numero, dados.complemento, dados.bairro,
        dados.cidade, dados.uf, Number(desconto_percentual), id, id_conta,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cliente.',
    })
  }
})

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `DELETE FROM cliente
       WHERE id_cliente = $1
       AND id_conta = $2
       RETURNING id_cliente`,
      [id, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      })
    }

    res.json({
      success: true,
      message: 'Cliente excluído com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir cliente.',
    })
  }
})

export default router