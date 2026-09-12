import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiBox,
  FiEye,
  FiPlus,
  FiSearch,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import './ProductsPage.css'

type Produto = {
  id_produto: number
  id_conta: number
  nome: string
  descricao: string | null
  preco: number | string
  estoque: number
  id_categoria: number
}

type Categoria = {
  id_categoria: number
  nome: string
}

type ProdutoForm = {
  nome: string
  descricao: string
  preco: string
  estoque: string
  id_categoria: string
}

const formularioInicial: ProdutoForm = {
  nome: '',
  descricao: '',
  preco: '',
  estoque: '0',
  id_categoria: '',
}

function formatarPreco(preco: number | string) {
  return Number(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function ProductsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busca, setBusca] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false)
  const [formulario, setFormulario] = useState<ProdutoForm>(formularioInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        const [produtosData, categoriasData] = await Promise.all([
          api('/produtos'),
          api('/categorias'),
        ])

        setProdutos(Array.isArray(produtosData) ? produtosData : [])
        setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      } catch (error: unknown) {
        console.error('Erro ao carregar produtos:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar produtos.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [toast])

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return produtos

    return produtos.filter((produto) => {
      const categoria = categorias.find(
        (item) => item.id_categoria === produto.id_categoria
      )

      return [produto.nome, produto.descricao, categoria?.nome]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo))
    })
  }, [busca, categorias, produtos])

  function abrirCriacao() {
    setFormulario({
      ...formularioInicial,
      id_categoria: categorias[0] ? String(categorias[0].id_categoria) : '',
    })
    setModalCriacaoAberto(true)
  }

  function atualizarCampo(campo: keyof ProdutoForm, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function handleCriarProduto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formulario.nome.trim() || !formulario.preco || !formulario.id_categoria) {
      toast.warning('Nome, preço e categoria são obrigatórios.')
      return
    }

    const preco = Number(formulario.preco.replace(',', '.'))
    const estoque = Number(formulario.estoque)

    if (!Number.isFinite(preco) || preco < 0 || !Number.isInteger(estoque) || estoque < 0) {
      toast.warning('Informe um preço válido e um estoque inteiro não negativo.')
      return
    }

    try {
      setSalvando(true)
      const novoProduto = await api('/produtos', {
        method: 'POST',
        body: JSON.stringify({
          nome: formulario.nome.trim(),
          descricao: formulario.descricao.trim() || null,
          preco,
          estoque,
          id_categoria: Number(formulario.id_categoria),
        }),
      })

      setProdutos((atuais) => [...atuais, novoProduto])
      setModalCriacaoAberto(false)
      setFormulario(formularioInicial)
      toast.success('Produto criado com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao criar produto:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar produto.')
    } finally {
      setSalvando(false)
    }
  }

  function nomeCategoria(idCategoria: number) {
    return categorias.find((categoria) => categoria.id_categoria === idCategoria)?.nome || 'Sem categoria'
  }

  return (
    <div className="products-page">
      <header className="products-header">
        <button className="products-back-button" onClick={() => navigate('/')} title="Voltar ao painel">
          <FiArrowLeft />
        </button>
        <div>
          <span className="products-eyebrow">Catálogo</span>
          <h1>Produtos</h1>
          <p>Organize os itens que fazem parte do seu negócio.</p>
        </div>
        <button className="products-primary-button" onClick={abrirCriacao}>
          <FiPlus /> Novo produto
        </button>
      </header>

      <main className="products-content">
        <section className="products-toolbar">
          <div className="products-count">
            <strong>{produtos.length}</strong>
            <span>{produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}</span>
          </div>
          <label className="products-search">
            <FiSearch />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar produto ou categoria"
              aria-label="Buscar produto ou categoria"
            />
          </label>
        </section>

        {carregando ? (
          <div className="products-state">
            <div className="products-spinner" />
            <span>Carregando produtos...</span>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="products-state products-empty-state">
            <div className="products-empty-icon"><FiBox /></div>
            <strong>{busca ? 'Nenhum produto encontrado' : 'Seu catálogo está vazio'}</strong>
            <p>{busca ? 'Tente buscar por outro nome ou categoria.' : 'Cadastre o primeiro produto para começar a organizar seu catálogo.'}</p>
            {!busca && (
              <button className="products-primary-button" onClick={abrirCriacao}>
                <FiPlus /> Cadastrar produto
              </button>
            )}
          </div>
        ) : (
          <section className="products-grid">
            {produtosFiltrados.map((produto) => (
              <article className="product-card" key={produto.id_produto}>
                <div className="product-card-topline">
                  <div className="product-icon"><FiBox /></div>
                  <span className="product-category">{nomeCategoria(produto.id_categoria)}</span>
                </div>
                <h2>{produto.nome}</h2>
                <p>{produto.descricao || 'Este produto ainda não possui uma descrição.'}</p>
                <div className="product-card-footer">
                  <div>
                    <span>Preço</span>
                    <strong>{formatarPreco(produto.preco)}</strong>
                  </div>
                  <div>
                    <span>Estoque</span>
                    <strong>{produto.estoque} un.</strong>
                  </div>
                  <button
                    className="product-view-button"
                    onClick={() => setProdutoSelecionado(produto)}
                    title={`Visualizar ${produto.nome}`}
                  >
                    <FiEye />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {produtoSelecionado && (
        <div className="products-modal-overlay" onClick={() => setProdutoSelecionado(null)}>
          <div className="products-modal" onClick={(event) => event.stopPropagation()}>
            <div className="products-modal-header">
              <div>
                <span className="products-eyebrow">Detalhes do produto</span>
                <h2>{produtoSelecionado.nome}</h2>
              </div>
              <button className="products-close-button" onClick={() => setProdutoSelecionado(null)} title="Fechar">
                <FiX />
              </button>
            </div>
            <div className="product-detail-grid">
              <div><span>Categoria</span><strong>{nomeCategoria(produtoSelecionado.id_categoria)}</strong></div>
              <div><span>Preço</span><strong>{formatarPreco(produtoSelecionado.preco)}</strong></div>
              <div><span>Estoque disponível</span><strong>{produtoSelecionado.estoque} unidades</strong></div>
            </div>
            <div className="product-description">
              <span>Descrição</span>
              <p>{produtoSelecionado.descricao || 'Nenhuma descrição informada.'}</p>
            </div>
          </div>
        </div>
      )}

      {modalCriacaoAberto && (
        <div className="products-modal-overlay" onClick={() => !salvando && setModalCriacaoAberto(false)}>
          <form className="products-modal products-form-modal" onSubmit={handleCriarProduto} onClick={(event) => event.stopPropagation()}>
            <div className="products-modal-header">
              <div>
                <span className="products-eyebrow">Novo cadastro</span>
                <h2>Criar produto</h2>
              </div>
              <button type="button" className="products-close-button" onClick={() => setModalCriacaoAberto(false)} title="Fechar" disabled={salvando}>
                <FiX />
              </button>
            </div>

            {categorias.length === 0 && (
              <div className="products-form-alert">Crie uma categoria antes de cadastrar um produto.</div>
            )}

            <div className="products-form-grid">
              <label>
                Nome do produto
                <input value={formulario.nome} onChange={(event) => atualizarCampo('nome', event.target.value)} placeholder="Ex.: Café especial" required />
              </label>
              <label>
                Categoria
                <span className="products-select-wrap">
                  <select value={formulario.id_categoria} onChange={(event) => atualizarCampo('id_categoria', event.target.value)} required disabled={categorias.length === 0}>
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((categoria) => <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nome}</option>)}
                  </select>
                </span>
              </label>
              <label>
                Preço
                <input type="text" inputMode="decimal" value={formulario.preco} onChange={(event) => atualizarCampo('preco', event.target.value)} placeholder="0,00" required />
              </label>
              <label>
                Estoque inicial
                <input type="number" min="0" step="1" value={formulario.estoque} onChange={(event) => atualizarCampo('estoque', event.target.value)} required />
              </label>
              <label className="products-form-full-width">
                Descrição
                <textarea value={formulario.descricao} onChange={(event) => atualizarCampo('descricao', event.target.value)} placeholder="Descreva o produto brevemente" rows={4} />
              </label>
            </div>
            <div className="products-form-actions">
              <button type="button" className="products-secondary-button" onClick={() => setModalCriacaoAberto(false)} disabled={salvando}>Cancelar</button>
              <button type="submit" className="products-primary-button" disabled={salvando || categorias.length === 0}>
                {salvando ? 'Salvando...' : 'Criar produto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
