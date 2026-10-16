import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import { ExternalMedia, MediaPreferences, setMediaChoice } from '../components/ExternalMedia.tsx'
import { VideoBlock } from '../components/blocks/VideoBlock.tsx'

beforeEach(() => { setMediaChoice('YouTube', undefined); setMediaChoice('Twitch', undefined) })

describe('Consentement aux lecteurs externes', () => {
  it('ne monte aucun lecteur avant accord et garde Twitch bloqué après accord YouTube', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<>
      <ExternalMedia provider="YouTube"><iframe title="Vidéo" src="https://www.youtube.com/embed/test" /></ExternalMedia>
      <ExternalMedia provider="Twitch"><iframe title="Direct" src="https://player.twitch.tv/" /></ExternalMedia>
    </>)
    expect(container.querySelectorAll('iframe')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Refuser YouTube' }))
    expect(container.querySelectorAll('iframe')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Autoriser YouTube' }))
    expect(container.querySelectorAll('iframe')).toHaveLength(1)
    expect(screen.queryByTitle('Direct')).not.toBeInTheDocument()
  })

  it('retire tous les lecteurs du même fournisseur depuis le pied de page', async () => {
    setMediaChoice('YouTube', 'allowed')
    const user = userEvent.setup()
    const { container } = renderWithProviders(<>
      <ExternalMedia provider="YouTube"><iframe title="Vidéo 1" /></ExternalMedia>
      <VideoBlock content={{ provider: 'youtube', url: 'https://www.youtube.com/watch?v=abc' }} />
      <MediaPreferences />
    </>)
    expect(container.querySelectorAll('iframe')).toHaveLength(2)
    await user.click(screen.getByText('Gérer les cookies'))
    await user.click(screen.getByRole('button', { name: 'Retirer le consentement YouTube' }))
    expect(container.querySelectorAll('iframe')).toHaveLength(0)
  })
})
