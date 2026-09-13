import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiBox,
  FiEye,
  FiPlus,
  FiSearch,
  FiSliders,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import './ProductsPage.css'

type Produto = {
  id_produto: number
  id_conta: number
  id_categoria: number
  nome: string
  descricao: string | null
  codigo_barras: string | null
  codigo_interno: string | null
  preco: number | string
  estoque: number
  estoque_minimo: number
  unidade_medida: string
  ativo: boolean
  data_cadastro: string
  data_atualizacao: string
}

type Categoria = {
  id_categoria: number
  nome: string
}

type UnidadeMedida = {
  id_unidade_medida: number
  codigo: string
  nome: string
  ativo: boolean
}

type ProdutoForm = {
  nome: string
  descricao: string
  codigo_barras: string
  codigo_interno: string
  preco: string
  estoque: string
  estoque_minimo: string
  unidade_medida: string
  ativo: boolean
  id_categoria: string
}

const formularioInicial: ProdutoForm = {
  nome: '',
  descricao: '',
  codigo_barras: '',
  codigo_interno: '',
  preco: '',
  estoque: '0',
  estoque_minimo: '0',
  unidade_medida: 'UN',
  ativo: true,
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
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroEstoque, setFiltroEstoque] = useState('')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
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
        const unidadesData = await api('/unidades-medida')

        setProdutos(Array.isArray(produtosData) ? produtosData : [])
        setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
        setUnidades(Array.isArray(unidadesData) ? unidadesData : [])
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

    return produtos.filter((produto) => {
      const categoria = categorias.find(
        (item) => item.id_categoria === produto.id_categoria
      )

      const correspondeTexto = !termo || [produto.nome, produto.descricao, produto.codigo_barras, produto.codigo_interno, categoria?.nome]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo))

      const correspondeCategoria = !filtroCategoria || String(produto.id_categoria) === filtroCategoria
      const correspondeUnidade = !filtroUnidade || produto.unidade_medida === filtroUnidade
      const correspondeStatus = !filtroStatus || (filtroStatus === 'ativo' ? produto.ativo : !produto.ativo)
      const correspondeEstoque = !filtroEstoque
        || (filtroEstoque === 'baixo' && produto.estoque <= produto.estoque_minimo)
        || (filtroEstoque === 'disponivel' && produto.estoque > produto.estoque_minimo)

      return correspondeTexto && correspondeCategoria && correspondeUnidade && correspondeStatus && correspondeEstoque
    })
  }, [busca, categorias, filtroCategoria, filtroEstoque, filtroStatus, filtroUnidade, produtos])

  const existemFiltros = Boolean(busca || filtroCategoria || filtroUnidade || filtroStatus || filtroEstoque)
  const quantidadeFiltros = [filtroCategoria, filtroUnidade, filtroStatus, filtroEstoque].filter(Boolean).length

  function limparFiltros() {
    setBusca('')
    setFiltroCategoria('')
    setFiltroUnidade('')
    setFiltroStatus('')
    setFiltroEstoque('')
  }

  function abrirCriacao() {
    setFormulario({
      ...formularioInicial,
      id_categoria: categorias[0] ? String(categorias[0].id_categoria) : '',
      unidade_medida: unidades.find((unidade) => unidade.ativo)?.codigo || 'UN',
    })
    setModalCriacaoAberto(true)
  }

  function abrirEdicao(produto: Produto) {
    setProdutoSelecionado(null)
    setProdutoEditando(produto)
    setFormulario({
      nome: produto.nome,
      descricao: produto.descricao || '',
      codigo_barras: produto.codigo_barras || '',
      codigo_interno: produto.codigo_interno || '',
      preco: String(produto.preco),
      estoque: String(produto.estoque),
      estoque_minimo: String(produto.estoque_minimo),
      unidade_medida: produto.unidade_medida,
      ativo: produto.ativo,
      id_categoria: String(produto.id_categoria),
    })
  }

  function atualizarCampo(campo: keyof ProdutoForm, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function handleSalvarProduto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formulario.nome.trim() || !formulario.preco || !formulario.id_categoria) {
      toast.warning('Nome, preço e categoria são obrigatórios.')
      return
    }

    const preco = Number(formulario.preco.replace(',', '.'))
    const estoque = Number(formulario.estoque)
    const estoqueMinimo = Number(formulario.estoque_minimo)

    if (!Number.isFinite(preco) || preco < 0 || !Number.isInteger(estoque) || estoque < 0 || !Number.isInteger(estoqueMinimo) || estoqueMinimo < 0) {
      toast.warning('Informe preço, estoque e estoque mínimo válidos.')
      return
    }

    try {
      setSalvando(true)
      const produtoSalvo = await api(produtoEditando ? `/produtos/${produtoEditando.id_produto}` : '/produtos', {
        method: produtoEditando ? 'PUT' : 'POST',
        body: JSON.stringify({
          nome: formulario.nome.trim(),
          descricao: formulario.descricao.trim() || null,
          codigo_barras: formulario.codigo_barras.trim() || null,
          codigo_interno: formulario.codigo_interno.trim() || null,
          preco,
          estoque,
          estoque_minimo: estoqueMinimo,
          unidade_medida: formulario.unidade_medida.trim().toUpperCase(),
          ativo: formulario.ativo,
          id_categoria: Number(formulario.id_categoria),
        }),
      })

      setProdutos((atuais) => produtoEditando
        ? atuais.map((produto) => produto.id_produto === produtoEditando.id_produto ? produtoSalvo : produto)
        : [...atuais, produtoSalvo])
      setModalCriacaoAberto(false)
      setProdutoEditando(null)
      setFormulario(formularioInicial)
      toast.success(produtoEditando ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao criar produto:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar produto.')
    } finally {
      setSalvando(false)
    }
  }

  function fecharFormulario() {
    if (!salvando) {
      setModalCriacaoAberto(false)
      setProdutoEditando(null)
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
            <strong>{produtosFiltrados.length}</strong>
            <span>{produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</span>
          </div>
          <div className="products-search-controls">
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
            <button
              type="button"
              className={filtrosAbertos || quantidadeFiltros ? 'products-filter-button active' : 'products-filter-button'}
              onClick={() => setFiltrosAbertos((aberto) => !aberto)}
              aria-expanded={filtrosAbertos}
            >
              <FiSliders /> Filtros{quantidadeFiltros > 0 && ` (${quantidadeFiltros})`}
            </button>
          </div>
        </section>

        {filtrosAbertos && <section className="products-filters" aria-label="Filtros de produtos">
          <span className="products-filter-select-wrap">
            <select value={filtroCategoria} onChange={(event) => setFiltroCategoria(event.target.value)} aria-label="Filtrar por categoria">
              <option value="">Todas as categorias</option>
              {categorias.map((categoria) => <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nome}</option>)}
            </select>
          </span>
          <span className="products-filter-select-wrap">
            <select value={filtroUnidade} onChange={(event) => setFiltroUnidade(event.target.value)} aria-label="Filtrar por unidade">
              <option value="">Todas as unidades</option>
              {unidades.map((unidade) => <option key={unidade.id_unidade_medida} value={unidade.codigo}>{unidade.codigo} - {unidade.nome}</option>)}
            </select>
          </span>
          <span className="products-filter-select-wrap">
            <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} aria-label="Filtrar por status">
              <option value="">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </span>
          <span className="products-filter-select-wrap">
            <select value={filtroEstoque} onChange={(event) => setFiltroEstoque(event.target.value)} aria-label="Filtrar por estoque">
              <option value="">Qualquer estoque</option>
              <option value="baixo">Estoque baixo</option>
              <option value="disponivel">Acima do mínimo</option>
            </select>
          </span>
          {existemFiltros && <button className="products-clear-filters" onClick={limparFiltros}>Limpar filtros</button>}
        </section>}

        {carregando ? (
          <div className="products-state">
            <div className="products-spinner" />
            <span>Carregando produtos...</span>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="products-state products-empty-state">
            <div className="products-empty-icon"><FiBox /></div>
            <strong>{existemFiltros ? 'Nenhum produto encontrado' : 'Seu catálogo está vazio'}</strong>
            <p>{existemFiltros ? 'Ajuste os filtros para encontrar outros produtos.' : 'Cadastre o primeiro produto para começar a organizar seu catálogo.'}</p>
            {!existemFiltros && (
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
                <div className="product-card-codes">
                  {produto.codigo_interno && <span>Cód. {produto.codigo_interno}</span>}
                  {produto.estoque <= produto.estoque_minimo && <span className="product-low-stock">Estoque baixo</span>}
                </div>
                <div className="product-card-footer">
                  <div>
                    <span>Preço</span>
                    <strong>{formatarPreco(produto.preco)}</strong>
                  </div>
                  <div>
                    <span>Estoque</span>
                    <strong>{produto.estoque} {produto.unidade_medida}</strong>
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
              <div><span>Estoque disponível</span><strong>{produtoSelecionado.estoque} {produtoSelecionado.unidade_medida}</strong></div>
              <div><span>Estoque mínimo</span><strong>{produtoSelecionado.estoque_minimo} {produtoSelecionado.unidade_medida}</strong></div>
              <div><span>Unidade</span><strong>{produtoSelecionado.unidade_medida}</strong></div>
              <div><span>Status</span><strong>{produtoSelecionado.ativo ? 'Ativo' : 'Inativo'}</strong></div>
              <div><span>Código interno</span><strong>{produtoSelecionado.codigo_interno || 'Não informado'}</strong></div>
              <div><span>Código de barras</span><strong>{produtoSelecionado.codigo_barras || 'Não informado'}</strong></div>
            </div>
            <div className="product-description">
              <span>Descrição</span>
              <p>{produtoSelecionado.descricao || 'Nenhuma descrição informada.'}</p>
            </div>
            <div className="products-form-actions">
              <button className="products-secondary-button" onClick={() => abrirEdicao(produtoSelecionado)}>Editar produto</button>
            </div>
          </div>
        </div>
      )}

      {(modalCriacaoAberto || produtoEditando) && (
        <div className="products-modal-overlay" onClick={fecharFormulario}>
          <form className="products-modal products-form-modal" onSubmit={handleSalvarProduto} onClick={(event) => event.stopPropagation()}>
            <div className="products-modal-header">
              <div>
                <span className="products-eyebrow">{produtoEditando ? 'Atualização' : 'Novo cadastro'}</span>
                <h2>{produtoEditando ? 'Editar produto' : 'Criar produto'}</h2>
              </div>
              <button type="button" className="products-close-button" onClick={fecharFormulario} title="Fechar" disabled={salvando}>
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
                Código interno
                <input value={formulario.codigo_interno} onChange={(event) => atualizarCampo('codigo_interno', event.target.value)} placeholder="Ex.: CAF-001" maxLength={50} />
              </label>
              <label>
                Código de barras
                <input inputMode="numeric" value={formulario.codigo_barras} onChange={(event) => atualizarCampo('codigo_barras', event.target.value)} placeholder="EAN / GTIN" maxLength={14} />
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
              <label>
                Estoque mínimo
                <input type="number" min="0" step="1" value={formulario.estoque_minimo} onChange={(event) => atualizarCampo('estoque_minimo', event.target.value)} required />
              </label>
              <label>
                Unidade de medida
                <span className="products-select-wrap">
                  <select value={formulario.unidade_medida} onChange={(event) => atualizarCampo('unidade_medida', event.target.value)} required>
                    {unidades.map((unidade) => (
                      <option key={unidade.id_unidade_medida} value={unidade.codigo} disabled={!unidade.ativo}>
                        {unidade.codigo} - {unidade.nome}{!unidade.ativo ? ' (bloqueada)' : ''}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="products-checkbox-label">
                <input type="checkbox" checked={formulario.ativo} onChange={(event) => setFormulario((atual) => ({ ...atual, ativo: event.target.checked }))} />
                Produto ativo
              </label>
              <label className="products-form-full-width">
                Descrição
                <textarea value={formulario.descricao} onChange={(event) => atualizarCampo('descricao', event.target.value)} placeholder="Descreva o produto brevemente" rows={4} />
              </label>
            </div>
            <div className="products-form-actions">
              <button type="button" className="products-secondary-button" onClick={fecharFormulario} disabled={salvando}>Cancelar</button>
              <button type="submit" className="products-primary-button" disabled={salvando || categorias.length === 0}>
                {salvando ? 'Salvando...' : produtoEditando ? 'Salvar alterações' : 'Criar produto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
