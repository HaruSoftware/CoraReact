function normalizarUrlDaApi(url: string) {
  const valor = url.trim().replace(/\/+$/, '')

  if (valor.startsWith('/')) {
    return valor.endsWith('/api') ? valor : `${valor}/api`
  }

  const urlComProtocolo = /^https?:\/\//i.test(valor)
    ? valor
    : `https://${valor}`
  const urlAbsoluta = new URL(urlComProtocolo)
  const caminho = urlAbsoluta.pathname.replace(/\/+$/, '')
  const caminhoDaApi = caminho.endsWith('/api') ? caminho : `${caminho}/api`

  return `${urlAbsoluta.origin}${caminhoDaApi}`
}

const API_URL = normalizarUrlDaApi(
  import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api')
)

export function urlDaApi(endpoint: string) {
  return `${API_URL}${endpoint}`
}

type ApiOptions = RequestInit & {
}

export async function api(
  endpoint: string,
  options: ApiOptions = {}
) {
  const { headers, ...fetchOptions } = options

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