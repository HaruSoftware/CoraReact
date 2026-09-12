import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import './CategoriesPage.css'

type Categoria = {
  id_categoria: number
  id_conta: number
  nome: string
}

function CategoriesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busca, setBusca] = useState('')
  const [nome, setNome] = useState('')
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [categoriaExcluindo, setCategoriaExcluindo] = useState<Categoria | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    async function carregarCategorias() {
      try {
        setCarregando(true)
        const dados = await api('/categorias')
        setCategorias(Array.isArray(dados) ? dados : [])
      } catch (error: unknown) {
        console.error('Erro ao carregar categorias:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar categorias.')
      } finally {
        setCarregando(false)
      }
    }

    carregarCategorias()
  }, [toast])

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return categorias
    return categorias.filter((categoria) => categoria.nome.toLowerCase().includes(termo))
  }, [busca, categorias])

  function abrirCriacao() {
    setCategoriaEditando(null)
    setNome('')
    setModalAberto(true)
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEditando(categoria)
    setNome(categoria.nome)
    setModalAberto(true)
  }

  function fecharModal(forcar = false) {
    if (salvando && !forcar) return
    setModalAberto(false)
    setCategoriaEditando(null)
    setNome('')
  }

  async function salvarCategoria(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nomeNormalizado = nome.trim()

    if (!nomeNormalizado) {
      toast.warning('Informe o nome da categoria.')
      return
    }

    try {
      setSalvando(true)
      const categoria = await api(
        categoriaEditando ? `/categorias/${categoriaEditando.id_categoria}` : '/categorias',
        {
          method: categoriaEditando ? 'PUT' : 'POST',
          body: JSON.stringify({ nome: nomeNormalizado }),
        }
      )

      setCategorias((atuais) => categoriaEditando
        ? atuais.map((item) => item.id_categoria === categoria.id_categoria ? categoria : item)
        : [...atuais, categoria]
      )
      fecharModal(true)
      toast.success(categoriaEditando ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao salvar categoria:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar categoria.')
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!categoriaExcluindo) return

    try {
      setExcluindo(true)
      await api(`/categorias/${categoriaExcluindo.id_categoria}`, { method: 'DELETE' })
      setCategorias((atuais) => atuais.filter((item) => item.id_categoria !== categoriaExcluindo.id_categoria))
      setCategoriaExcluindo(null)
      toast.success('Categoria excluída com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao excluir categoria:', error)
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a categoria.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="categories-page">
      <header className="categories-header">
        <button className="categories-back-button" onClick={() => navigate('/')} title="Voltar ao painel">
          <FiArrowLeft />
        </button>
        <div>
          <span className="categories-eyebrow">Catálogo</span>
          <h1>Categorias</h1>
          <p>Estruture seu catálogo para encontrar produtos com facilidade.</p>
        </div>
        <button className="categories-primary-button" onClick={abrirCriacao}>
          <FiPlus /> Nova categoria
        </button>
      </header>

      <main className="categories-content">
        <section className="categories-toolbar">
          <div className="categories-count">
            <strong>{categorias.length}</strong>
            <span>{categorias.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}</span>
          </div>
          <label className="categories-search">
            <FiSearch />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar categoria"
              aria-label="Buscar categoria"
            />
          </label>
        </section>

        {carregando ? (
          <div className="categories-state"><div className="categories-spinner" /><span>Carregando categorias...</span></div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="categories-state">
            <div className="categories-empty-icon"><FiTag /></div>
            <strong>{busca ? 'Nenhuma categoria encontrada' : 'Seu catálogo ainda não tem categorias'}</strong>
            <p>{busca ? 'Tente buscar por outro nome.' : 'Crie categorias para organizar os produtos da sua conta.'}</p>
            {!busca && <button className="categories-primary-button" onClick={abrirCriacao}><FiPlus /> Criar categoria</button>}
          </div>
        ) : (
          <section className="categories-list">
            {categoriasFiltradas.map((categoria) => (
              <article className="category-row" key={categoria.id_categoria}>
                <div className="category-row-main">
                  <div className="category-icon"><FiTag /></div>
                  <div>
                    <strong>{categoria.nome}</strong>
                    <span>Categoria de produtos</span>
                  </div>
                </div>
                <div className="category-actions">
                  <button className="category-action-button" onClick={() => abrirEdicao(categoria)} title={`Editar ${categoria.nome}`}>
                    <FiEdit2 />
                  </button>
                  <button className="category-action-button delete" onClick={() => setCategoriaExcluindo(categoria)} title={`Excluir ${categoria.nome}`}>
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {modalAberto && (
        <div className="categories-modal-overlay" onClick={() => fecharModal()}>
          <form className="categories-modal" onSubmit={salvarCategoria} onClick={(event) => event.stopPropagation()}>
            <div className="categories-modal-header">
              <div>
                <span className="categories-eyebrow">Catálogo</span>
                <h2>{categoriaEditando ? 'Editar categoria' : 'Criar categoria'}</h2>
              </div>
              <button type="button" className="categories-close-button" onClick={() => fecharModal()} disabled={salvando} title="Fechar"><FiX /></button>
            </div>
            <label className="category-form-label">
              Nome da categoria
              <input autoFocus value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Bebidas" maxLength={100} required />
            </label>
            <div className="categories-form-actions">
              <button type="button" className="categories-secondary-button" onClick={() => fecharModal()} disabled={salvando}>Cancelar</button>
              <button type="submit" className="categories-primary-button" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar categoria'}</button>
            </div>
          </form>
        </div>
      )}

      {categoriaExcluindo && (
        <div className="categories-modal-overlay" onClick={() => !excluindo && setCategoriaExcluindo(null)}>
          <div className="categories-modal categories-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="categories-modal-header">
              <div>
                <span className="categories-eyebrow">Atenção</span>
                <h2>Excluir categoria?</h2>
              </div>
              <button className="categories-close-button" onClick={() => setCategoriaExcluindo(null)} disabled={excluindo} title="Fechar"><FiX /></button>
            </div>
            <p>Você está prestes a excluir <strong>{categoriaExcluindo.nome}</strong>. Produtos vinculados podem impedir esta exclusão.</p>
            <div className="categories-form-actions">
              <button className="categories-secondary-button" onClick={() => setCategoriaExcluindo(null)} disabled={excluindo}>Cancelar</button>
              <button className="categories-danger-button" onClick={confirmarExclusao} disabled={excluindo}>{excluindo ? 'Excluindo...' : 'Excluir categoria'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
