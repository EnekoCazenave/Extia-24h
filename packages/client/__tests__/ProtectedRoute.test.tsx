import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import ProtectedRoute from '../src/components/ProtectedRoute.tsx'

vi.mock('../src/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}))
import { useAuth } from '../src/hooks/useAuth.ts'
const mockUseAuth = vi.mocked(useAuth)

function renderWithRouter(initialRoute = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows loading state while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true, login: vi.fn(), logout: vi.fn() })
    renderWithRouter()
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
  })

  it('redirects to /login when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })
    renderWithRouter()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders outlet when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, login: 'u', email: 'u@test.com', firstname: 'U', lastname: 'S', intern: false, role: { id: 1, name: 'user' } },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    renderWithRouter()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
