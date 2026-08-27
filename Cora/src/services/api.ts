const API_URL = 'http://localhost:3000/api'

type ApiOptions = RequestInit & {
  token?: string
}

export async function api(
  endpoint: string,
  options: ApiOptions = {}
) {
  const { token, headers, ...fetchOptions } = options

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição.')
  }

  return data
}