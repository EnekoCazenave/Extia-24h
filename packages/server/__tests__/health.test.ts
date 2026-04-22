import { describe, it, expect, afterAll } from 'vitest'
import { buildTestApp } from './helpers/buildApp.js'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const app = await buildTestApp()
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
    await app.close()
  })

  it('sets X-Frame-Options header (helmet)', async () => {
    const app = await buildTestApp()
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    await app.close()
  })
})
