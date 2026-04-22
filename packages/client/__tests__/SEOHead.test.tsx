import { render, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { describe, it, expect, afterEach } from 'vitest'
import SEOHead from '../src/components/SEOHead.tsx'

afterEach(() => {
  document.head.innerHTML = ''
  document.title = ''
})

function renderSEO(props: Parameters<typeof SEOHead>[0]) {
  render(
    <HelmetProvider>
      <SEOHead {...props} />
    </HelmetProvider>,
  )
}

describe('SEOHead', () => {
  it('sets page title with site name suffix', async () => {
    renderSEO({ title: 'Accueil', description: 'desc' })
    await waitFor(() => {
      expect(document.title).toContain('Accueil | Extia Gaming 24h')
    })
  })

  it('does not double site name when title equals site name', async () => {
    renderSEO({ title: 'Extia Gaming 24h', description: 'desc' })
    await waitFor(() => {
      expect(document.title).toBe('Extia Gaming 24h')
    })
    expect(document.title).not.toContain('Extia Gaming 24h | Extia Gaming 24h')
  })

  it('includes og:title meta', async () => {
    renderSEO({ title: 'Test Page', description: 'A test page' })
    await waitFor(() => {
      const ogTitle = document.querySelector('meta[property="og:title"]')
      expect(ogTitle?.getAttribute('content')).toContain('Test Page | Extia Gaming 24h')
    })
  })

  it('renders JSON-LD script when jsonLd provided', async () => {
    renderSEO({
      title: 'Page',
      description: 'desc',
      jsonLd: { '@type': 'Event', name: 'Test' },
    })
    await waitFor(() => {
      const script = document.querySelector('script[type="application/ld+json"]')
      expect(script?.textContent).toContain('"@type":"Event"')
    })
  })
})
