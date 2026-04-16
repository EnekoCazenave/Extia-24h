import { buildApp } from '../../src/app.js'
import type { FastifyInstance } from 'fastify'

export async function buildTestApp(): Promise<FastifyInstance> {
  // Silence logs in tests
  const app = await buildApp({ logger: false })
  await app.ready()
  return app
}
