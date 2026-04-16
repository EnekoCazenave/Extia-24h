import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import App from '../src/App.tsx'

vi.mock('../src/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(() => ({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })),
}))

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  )
}

describe('App', () => {
  it('renders without crashing', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Extia Gaming 24h' })).toBeInTheDocument()
  })
})
