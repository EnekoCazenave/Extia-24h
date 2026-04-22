import type { FastifyInstance } from 'fastify'
import multipart from '@fastify/multipart'
import { authenticate } from '../hooks/authenticate.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')

export async function uploadRoutes(fastify: FastifyInstance) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })

  await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  fastify.post('/api/upload', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'No file provided' })

    const ext = path.extname(data.filename).toLowerCase()
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if (!allowed.includes(ext)) {
      return reply.code(400).send({ error: 'File type not allowed' })
    }

    const filename = `${crypto.randomUUID()}${ext}`
    const dest = path.join(UPLOADS_DIR, filename)
    await fs.writeFile(dest, await data.toBuffer())

    return reply.send({ url: `/uploads/${filename}` })
  })
}
