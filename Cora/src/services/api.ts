const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'))
  .replace(/\/+$/, '')

export function urlDaApi(endpoint: string) {
  return `${API_URL}${endpoint}`
}

type ApiOptions = RequestInit & {
  token?: string
}

export async function api(
  endpoint: string,
  options: ApiOptions = {}
) {
  const { token, headers, ...fetchOptions } = options

  const response = await fetch(urlDaApi(endpoint), {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição.')
  }

  return data
}