import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from 'react-icons/fi'
import './Toast.css'

export type ToastTipo = 'success' | 'error' | 'warning' | 'info'

export type ToastItem = {
  id: string
  tipo: ToastTipo
  mensagem: string
  titulo?: string
  saindo?: boolean
}

type ToastContextData = {
  toast: {
    success: (mensagem: string, titulo?: string) => void
    error: (mensagem: string, titulo?: string) => void
    warning: (mensagem: string, titulo?: string) => void
    info: (mensagem: string, titulo?: string) => void
    show: (tipo: ToastTipo, mensagem: string, titulo?: string, duracao?: number) => void
  }
}

const ToastContext = createContext<ToastContextData | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removerToast = useCallback((id: string) => {
    // Inicia a animação de fade-out / slide-out
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, saindo: true } : t))
    )

    // Remove do estado após a animação de 300ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }, [])

  const adicionarToast = useCallback(
    (
      tipo: ToastTipo,
      mensagem: string,
      titulo?: string,
      duracao: number = 4000
    ) => {
      const id = Math.random().toString(36).substring(2, 9)

      const novoToast: ToastItem = {
        id,
        tipo,
        mensagem,
        titulo,
        saindo: false,
      }

      setToasts((prev) => [...prev, novoToast])

      // Timer para auto-dismiss com fade out
      setTimeout(() => {
        removerToast(id)
      }, duracao)
    },
    [removerToast]
  )

  const toastMethods = {
    success: (mensagem: string, titulo?: string) =>
      adicionarToast('success', mensagem, titulo),
    error: (mensagem: string, titulo?: string) =>
      adicionarToast('error', mensagem, titulo),
    warning: (mensagem: string, titulo?: string) =>
      adicionarToast('warning', mensagem, titulo),
    info: (mensagem: string, titulo?: string) =>
      adicionarToast('info', mensagem, titulo),
    show: (
      tipo: ToastTipo,
      mensagem: string,
      titulo?: string,
      duracao?: number
    ) => adicionarToast(tipo, mensagem, titulo, duracao),
  }

  function renderIcone(tipo: ToastTipo) {
    switch (tipo) {
      case 'success':
        return <FiCheckCircle className="toast-icon-svg" />
      case 'error':
        return <FiAlertCircle className="toast-icon-svg" />
      case 'warning':
        return <FiAlertTriangle className="toast-icon-svg" />
      case 'info':
        return <FiInfo className="toast-icon-svg" />
    }
  }

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}

      {/* POPUP CONTAINER FLUTUANTE */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-box toast-${t.tipo} ${
              t.saindo ? 'toast-fade-out' : 'toast-fade-in'
            }`}
            role="alert"
          >
            <div className="toast-icon-wrapper">{renderIcone(t.tipo)}</div>

            <div className="toast-content-wrapper">
              {t.titulo && <strong className="toast-title">{t.titulo}</strong>}
              <span className="toast-message">{t.mensagem}</span>
            </div>

            <button
              className="toast-close-btn"
              onClick={() => removerToast(t.id)}
              aria-label="Fechar notificação"
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider.')
  }

  return context
}
