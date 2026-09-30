import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlanPicker from '../components/PlanPicker'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import './PlanSelectionPage.css'

function PlanSelectionPage() {
  const navigate = useNavigate()
  const { atualizarUsuario } = useAuth()
  const { toast } = useToast()
  const [idPlano, setIdPlano] = useState<number | null>(null)
  const [ativando, setAtivando] = useState(false)

  async function ativarPlano(event: React.FormEvent) {
    event.preventDefault()

    if (!idPlano) return

    try {
      setAtivando(true)
      await api('/assinaturas', {
        method: 'POST',
        body: JSON.stringify({ id_plano: idPlano }),
      })
      await atualizarUsuario()
      toast.success('Plano ativado. Sua conta está pronta para uso.')
      navigate('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível ativar o plano.')
    } finally {
      setAtivando(false)
    }
  }

  return (
    <main className="plan-selection-page">
      <section className="plan-selection-card">
        <header>
          <span>Conta Cora</span>
          <h1>Escolha seu plano</h1>
          <p>Selecione um plano mensal para continuar. A ativação é imediata e não há cobrança.</p>
        </header>

        <form onSubmit={ativarPlano}>
          <PlanPicker selectedPlanId={idPlano} onSelect={setIdPlano} disabled={ativando} />
          <button className="plan-selection-submit" type="submit" disabled={!idPlano || ativando}>
            {ativando ? 'Ativando plano...' : 'Ativar plano e continuar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default PlanSelectionPage