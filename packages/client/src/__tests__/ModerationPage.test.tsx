import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import ModerationPage from '../pages/ModerationPage.tsx'

const mocks = vi.hoisted(() => ({ roleId: 2, get: vi.fn(), delete: vi.fn() }))
vi.mock('../hooks/useAuth.ts', () => ({ useAuth: () => ({ user: { role: { id: mocks.roleId } } }) }))
vi.mock('../services/api.ts', () => ({ api: { get: mocks.get, delete: mocks.delete } }))

beforeEach(() => {
  vi.restoreAllMocks()
  vi.resetAllMocks()
  mocks.roleId = 2
  mocks.get.mockImplementation(async (url: string) => ({ data: url === '/api/games' ? { games: [] } : { sessions: [] } }))
  mocks.delete.mockResolvedValue({ data: { deletedCount: 3 } })
})

describe('Suppression de toutes les parties', () => {
  it.each([1, 3])('masque le bouton pour le rôle %i', async roleId => {
    mocks.roleId = roleId
    renderWithProviders(<ModerationPage />)
    await screen.findByText('Aucune partie validée.')
    expect(screen.queryByRole('button', { name: 'Supprimer toutes les parties' })).not.toBeInTheDocument()
  })

  it('ne supprime rien lorsque la confirmation est annulée', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderWithProviders(<ModerationPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer toutes les parties' }))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Cette action est irréversible.'))
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  it('demande confirmation, supprime sans filtre et recharge les données après succès', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    let finish!: () => void
    mocks.delete.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    renderWithProviders(<ModerationPage />)
    await screen.findByText('Aucune partie validée.')
    const readsBeforeDelete = mocks.get.mock.calls.length
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer toutes les parties' }))
    expect(screen.getByRole('button', { name: 'Suppression…' })).toBeDisabled()
    expect(mocks.delete).toHaveBeenCalledTimes(1)
    expect(mocks.delete).toHaveBeenCalledWith('/api/moderation/sessions')
    finish()
    expect(await screen.findByRole('status')).toHaveTextContent('Toutes les parties et leurs points associés ont été supprimés.')
    await waitFor(() => expect(mocks.get.mock.calls.length).toBeGreaterThan(readsBeforeDelete))
    expect(screen.getByRole('button', { name: 'Supprimer toutes les parties' })).toBeEnabled()
  })

  it('affiche une erreur et permet de réessayer si la suppression échoue', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mocks.delete.mockRejectedValue(new Error('Network unavailable'))
    renderWithProviders(<ModerationPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer toutes les parties' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de supprimer les parties. Veuillez réessayer.')
    expect(screen.getByRole('button', { name: 'Supprimer toutes les parties' })).toBeEnabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
