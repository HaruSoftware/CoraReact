import { api } from './api'

type LoginResponse = {
  success: boolean
  token: string
}

export async function login(email: string, senha: string) {
  const data: LoginResponse = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      senha,
    }),
  })

  if (!data.success || !data.token) {
    throw new Error('Não foi possível realizar o login.')
  }

  localStorage.setItem('token', data.token)

  return data
}

export function logout() {
  localStorage.removeItem('token')
}

export function getToken() {
  return localStorage.getItem('token')
}