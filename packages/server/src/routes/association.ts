import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  CreateAssociationSchema,
  UpdateAssociationSchema,
  CreateBlockSchema,
  UpdateBlockSchema,
  ReorderBlocksSchema,
} from '@extia-gaming/shared'
import {
  handleListPublishedAssociations,
  handleGetAssociationBySlug,
  handleListAllAssociations,
  handleGetAdminAssociation,
  handleCreateAssociation,
  handleUpdateAssociation,
  handleDeleteAssociation,
  handleCreateBlock,
  handleUpdateBlock,
  handleDeleteBlock,
  handleReorderBlocks,
} from '../controllers/association.controller.js'
import { requireAdmin } from '../hooks/requireAdmin.js'

export async function associationRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.get('/api/associations', handleListPublishedAssociations)
  f.get('/api/associations/:slug', handleGetAssociationBySlug)

  const adminGuard = { preHandler: [requireAdmin] }

  f.get('/api/admin/associations', adminGuard, handleListAllAssociations)
  f.get('/api/admin/associations/:id', adminGuard, handleGetAdminAssociation)
  f.post(
    '/api/admin/associations',
    { ...adminGuard, schema: { body: CreateAssociationSchema } },
    handleCreateAssociation,
  )
  f.put(
    '/api/admin/associations/:id',
    { ...adminGuard, schema: { body: UpdateAssociationSchema } },
    handleUpdateAssociation,
  )
  f.delete('/api/admin/associations/:id', adminGuard, handleDeleteAssociation)

  f.post(
    '/api/admin/associations/:id/blocks/reorder',
    { ...adminGuard, schema: { body: ReorderBlocksSchema } },
    handleReorderBlocks,
  )
  f.post(
    '/api/admin/associations/:id/blocks',
    { ...adminGuard, schema: { body: CreateBlockSchema } },
    handleCreateBlock,
  )
  f.put(
    '/api/admin/associations/:id/blocks/:blockId',
    { ...adminGuard, schema: { body: UpdateBlockSchema } },
    handleUpdateBlock,
  )
  f.delete('/api/admin/associations/:id/blocks/:blockId', adminGuard, handleDeleteBlock)
}
