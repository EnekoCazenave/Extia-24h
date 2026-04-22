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

// Tracks whether a refresh attempt already failed this session.
// Prevents infinite loop: 401 → refresh → 401 → refresh → ...
let refreshFailed = false

export function resetRefreshState() {
  refreshFailed = false
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isRefreshCall = error.config?.url?.includes('/auth/refresh')
    if (
      error.response?.status === 401 &&
      !error.config._retry &&
      !refreshFailed &&
      !isRefreshCall
    ) {
      error.config._retry = true
      try {
        await api.post('/auth/refresh')
        return api(error.config)
      } catch {
        refreshFailed = true
      }
    }
    return Promise.reject(error)
  },
)
