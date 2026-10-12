import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
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

  f.get<RouteOf<typeof handleListPublishedAssociations>>('/api/associations', handleListPublishedAssociations)
  f.get<RouteOf<typeof handleGetAssociationBySlug>>('/api/associations/:slug', handleGetAssociationBySlug)

  const adminGuard = { preHandler: [requireAdmin] }

  f.get<RouteOf<typeof handleListAllAssociations>>('/api/admin/associations', adminGuard, handleListAllAssociations)
  f.get<RouteOf<typeof handleGetAdminAssociation>>('/api/admin/associations/:id', adminGuard, handleGetAdminAssociation)
  f.post<RouteOf<typeof handleCreateAssociation>>(
    '/api/admin/associations',
    { ...adminGuard, schema: { body: CreateAssociationSchema } }, handleCreateAssociation)
  f.put<RouteOf<typeof handleUpdateAssociation>>(
    '/api/admin/associations/:id',
    { ...adminGuard, schema: { body: UpdateAssociationSchema } }, handleUpdateAssociation)
  f.delete<RouteOf<typeof handleDeleteAssociation>>('/api/admin/associations/:id', adminGuard, handleDeleteAssociation)

  f.post<RouteOf<typeof handleReorderBlocks>>(
    '/api/admin/associations/:id/blocks/reorder',
    { ...adminGuard, schema: { body: ReorderBlocksSchema } }, handleReorderBlocks)
  f.post<RouteOf<typeof handleCreateBlock>>(
    '/api/admin/associations/:id/blocks',
    { ...adminGuard, schema: { body: CreateBlockSchema } }, handleCreateBlock)
  f.put<RouteOf<typeof handleUpdateBlock>>(
    '/api/admin/associations/:id/blocks/:blockId',
    { ...adminGuard, schema: { body: UpdateBlockSchema } }, handleUpdateBlock)
  f.delete<RouteOf<typeof handleDeleteBlock>>('/api/admin/associations/:id/blocks/:blockId', adminGuard, handleDeleteBlock)
}

type RouteOf<T> = T extends (request: FastifyRequest<infer R>, reply: FastifyReply) => unknown ? R : never
