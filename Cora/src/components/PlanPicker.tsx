import { useEffect, useState } from 'react'
import { api } from '../services/api'

export type Plano = {
  id_plano: number
  codigo: string
  nome: string
  descricao: string
  preco_mensal: string | number
  demonstrativo: boolean
}

type PlanPickerProps = {
  selectedPlanId: number | null
  onSelect: (id: number) => void
  disabled?: boolean
}

function PlanPicker({ selectedPlanId, onSelect, disabled = false }: PlanPickerProps) {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    api('/planos')
      .then((data) => {
        if (ativo) setPlanos(Array.isArray(data) ? data : [])
      })
      .catch((error: unknown) => {
        if (ativo) {
          setErro(error instanceof Error ? error.message : 'Não foi possível carregar os planos.')
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const formatarPreco = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <fieldset className="plan-picker" disabled={disabled}>
      <legend>Escolha seu plano mensal</legend>
      <p className="plan-picker-caption">A assinatura é ativada imediatamente. Nenhuma cobrança é realizada.</p>

      {carregando && <p className="plan-picker-message">Carregando planos...</p>}
      {erro && <p className="plan-picker-error" role="alert">{erro}</p>}
      {!carregando && !erro && planos.length === 0 && (
        <p className="plan-picker-error" role="alert">Nenhum plano está disponível no momento.</p>
      )}

      {planos.length > 0 && (
        <div className="plan-options">
          {planos.map((plano) => (
            <label
              className={selectedPlanId === plano.id_plano ? 'plan-option selected' : 'plan-option'}
              key={plano.id_plano}
            >
              <input
                type="radio"
                name="id_plano"
                value={plano.id_plano}
                checked={selectedPlanId === plano.id_plano}
                onChange={() => onSelect(plano.id_plano)}
                required
              />
              <span className="plan-option-content">
                <span className="plan-option-heading">
                  <strong>{plano.nome}</strong>
                  <span>{formatarPreco.format(Number(plano.preco_mensal))}<small> / mês</small></span>
                </span>
                <span className="plan-option-description">{plano.descricao}</span>
                {plano.demonstrativo && <span className="plan-demo-badge">Valor demonstrativo</span>}
              </span>
            </label>
          ))}
        </div>
      )}

      <p className="plan-picker-disclaimer">Os valores exibidos são provisórios e não representam uma cobrança.</p>
    </fieldset>
  )
}

export default PlanPicker