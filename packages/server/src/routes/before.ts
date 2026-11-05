import type { FastifyInstance } from 'fastify'
import multipart from '@fastify/multipart'
import { z } from 'zod'
import { requireAdmin } from '../hooks/requireAdmin.js'
import { EventError } from '../services/event-scoring.service.js'
import { importBeforeParticipants, listBeforeParticipants, parseBeforeWorkbook } from '../services/before.service.js'

export async function beforeRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart,{limits:{fileSize:10*1024*1024,files:1,fields:2,parts:3}})
  const guard = {preHandler:[requireAdmin]}
  fastify.get('/api/admin/before',guard,async (_request,reply) => {
    reply.header('Cache-Control','no-store')
    return {participants:await listBeforeParticipants()}
  })
  fastify.post('/api/admin/before/import',guard,async (request,reply) => {
    try {
      let buffer: Buffer | undefined, filename = '', sourceKey = 'before-mariokart', replaceExisting = false
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (!part.filename.toLowerCase().endsWith('.xlsx')) throw new EventError('Utilisez un fichier Excel .xlsx.',400)
          filename = part.filename.replace(/^.*[\\/]/,'').slice(0,255)
          buffer = await part.toBuffer()
        } else if (part.fieldname === 'sourceKey') sourceKey = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).parse(part.value)
        else if (part.fieldname === 'replaceExisting') replaceExisting = z.enum(['true','false']).parse(part.value) === 'true'
      }
      if (!buffer) throw new EventError('Choisissez le fichier Excel à importer.',400)
      const rows = await parseBeforeWorkbook(buffer)
      const report = await importBeforeParticipants(rows,sourceKey,filename,request.user.sub,replaceExisting)
      return reply.header('Cache-Control','no-store').send({report})
    } catch (error) {
      if (error instanceof EventError) return reply.code(error.statusCode).send({error:error.message})
      if (error instanceof z.ZodError) return reply.code(400).send({error:'Identifiant du Before ou confirmation de remplacement invalide.'})
      throw error
    }
  })
}
