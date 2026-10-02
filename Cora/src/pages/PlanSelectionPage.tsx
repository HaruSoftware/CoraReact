import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlanPicker from '../components/PlanPicker'
import { useAuth } from '../contexts/AuthContextValue'
import { useToast } from '../contexts/ToastContextValue'
import { api } from '../services/api'
import { FiArrowRight, FiCheck } from 'react-icons/fi'
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
      <header className="plan-selection-topbar">
        <div className="plan-selection-brand">
          <strong>Cora</strong>
          <span>Gestão do seu negócio</span>
        </div>
        <div className="plan-selection-progress">
          <span>02</span>
          <div>
            <strong>Etapa final</strong>
            <small>Configuração da conta</small>
          </div>
        </div>
      </header>

      <div className="plan-selection-layout">
        <section className="plan-selection-intro">
          <span className="plan-selection-kicker">SUA CONTA ESTÁ PRONTA</span>
          <div>
            <h1>Escolha o plano para começar.</h1>
            <p>Selecione uma opção para liberar o painel e organizar a gestão do seu negócio.</p>
          </div>
          <div className="plan-selection-assurance">
            <span><FiCheck /></span>
            <div>
              <strong>Ativação imediata</strong>
              <p>Sem cobrança nesta etapa.</p>
            </div>
          </div>
        </section>

        <section className="plan-selection-content" aria-labelledby="plan-selection-title">
          <div className="plan-selection-content-heading">
            <span>PLANOS DISPONÍVEIS</span>
            <h2 id="plan-selection-title">Encontre o ritmo certo para sua operação.</h2>
            <p>A escolha pode ser feita agora para concluir a configuração da conta.</p>
          </div>

          <form onSubmit={ativarPlano}>
            <PlanPicker selectedPlanId={idPlano} onSelect={setIdPlano} disabled={ativando} />
            <button className="plan-selection-submit" type="submit" disabled={!idPlano || ativando}>
              <span>{ativando ? 'Ativando plano...' : 'Ativar plano e continuar'}</span>
              <FiArrowRight aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default PlanSelectionPage