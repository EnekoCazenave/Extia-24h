import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'
import { authenticate } from '../src/hooks/authenticate.js'

describe('authenticate hook', () => {
  it('rejects request without cookie', async () => {
    const app = await buildApp({ logger: false })

    // Register a test route that uses the authenticate hook (before ready)
    app.get('/protected', { preHandler: [authenticate] }, async () => ({ ok: true }))

    await app.ready()

    const response = await app.inject({ method: 'GET', url: '/protected' })
    expect(response.statusCode).toBe(401)
    expect(response.json().error).toBe('Unauthorized')

    await app.close()
  })

  it('allows request with valid access_token cookie', async () => {
    const app = await buildApp({ logger: false })

    // Register a test route that uses the authenticate hook (before ready)
    app.get('/protected', { preHandler: [authenticate] }, async () => ({ ok: true }))

    await app.ready()

    // Generate a valid token
    const token = app.jwt.sign({ sub: 1, email: 'test@test.com', roleId: 1 })

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      cookies: { access_token: token },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })

    await app.close()
  })
})
