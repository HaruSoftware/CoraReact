import { api } from './api'

export async function login(email: string, senha: string) {
  await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      senha,
    }),
  })
}

export async function logout() {
  await api('/auth/logout', {
    method: 'POST',
  })
}