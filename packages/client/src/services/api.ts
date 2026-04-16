import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

function getCsrfToken(): string | null {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('_csrf='))
    ?.split('=')[1] ?? null
}

api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase()
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCsrfToken()
    if (csrf) config.headers['x-csrf-token'] = csrf
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      try {
        await api.post('/auth/refresh')
        return api(error.config)
      } catch {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
