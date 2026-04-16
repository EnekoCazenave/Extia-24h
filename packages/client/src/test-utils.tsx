import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import type { ReactNode } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

interface ProvidersProps {
  children: ReactNode
  initialEntries?: string[]
}

function Providers({ children, initialEntries = ['/'] }: ProvidersProps) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[] },
) {
  const { initialEntries, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: ({ children }) => <Providers initialEntries={initialEntries}>{children}</Providers>,
    ...renderOptions,
  })
}

export { renderWithProviders }
export * from '@testing-library/react'
