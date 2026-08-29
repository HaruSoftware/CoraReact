const API_URL = 'http://localhost:3000/api'

type ApiOptions = RequestInit

export async function api(
  endpoint: string,
  options: ApiOptions = {}
) {
  const { headers, ...fetchOptions } = options

  const response = await fetch(`${API_URL}${endpoint}`, {
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
