import { createContext, useContext } from 'react'

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

export const ToastContext = createContext<ToastContextData | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider.')
  }

  return context
}