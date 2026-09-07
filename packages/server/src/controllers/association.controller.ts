import type { FastifyRequest, FastifyReply } from 'fastify'
import type {
  CreateAssociationInput,
  UpdateAssociationInput,
  CreateBlockInput,
  UpdateBlockInput,
  ReorderBlocksInput,
} from '@extia-gaming/shared'
import {
  listPublishedAssociations,
  getAssociationBySlug,
  listAllAssociations,
  getAdminAssociation,
  createAssociation,
  updateAssociation,
  deleteAssociation,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
} from '../services/association.service.js'

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10)
  return isNaN(n) ? null : n
}

export async function handleListPublishedAssociations(_request: FastifyRequest, reply: FastifyReply) {
  const associations = await listPublishedAssociations()
  return reply.send({ associations })
}

export async function handleGetAssociationBySlug(
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
) {
  try {
    const association = await getAssociationBySlug(request.params.slug)
    return reply.send({ association })
  } catch (err) {
    if (err instanceof Error && err.message === 'ASSOCIATION_NOT_FOUND') {
      return reply.code(404).send({ error: 'Association not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleListAllAssociations(_request: FastifyRequest, reply: FastifyReply) {
  const associations = await listAllAssociations()
  return reply.send({ associations })
}

export async function handleGetAdminAssociation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const id = parseId(request.params.id)
  if (id === null) return reply.code(400).send({ error: 'Invalid association id', statusCode: 400 })
  try {
    const association = await getAdminAssociation(id)
    return reply.send({ association })
  } catch (err) {
    if (err instanceof Error && err.message === 'ASSOCIATION_NOT_FOUND') {
      return reply.code(404).send({ error: 'Association not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleCreateAssociation(
  request: FastifyRequest<{ Body: CreateAssociationInput }>,
  reply: FastifyReply,
) {
  const association = await createAssociation(request.body)
  return reply.code(201).send({ association })
}

export async function handleUpdateAssociation(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateAssociationInput }>,
  reply: FastifyReply,
) {
  const id = parseId(request.params.id)
  if (id === null) return reply.code(400).send({ error: 'Invalid association id', statusCode: 400 })
  try {
    const association = await updateAssociation(id, request.body)
    return reply.send({ association })
  } catch (err) {
    if (err instanceof Error && err.message === 'ASSOCIATION_NOT_FOUND') {
      return reply.code(404).send({ error: 'Association not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleDeleteAssociation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const id = parseId(request.params.id)
  if (id === null) return reply.code(400).send({ error: 'Invalid association id', statusCode: 400 })
  try {
    await deleteAssociation(id)
    return reply.code(204).send()
  } catch (err) {
    if (err instanceof Error && err.message === 'ASSOCIATION_NOT_FOUND') {
      return reply.code(404).send({ error: 'Association not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleCreateBlock(
  request: FastifyRequest<{ Params: { id: string }; Body: CreateBlockInput }>,
  reply: FastifyReply,
) {
  const id = parseId(request.params.id)
  if (id === null) return reply.code(400).send({ error: 'Invalid association id', statusCode: 400 })
  try {
    const block = await createBlock(id, request.body)
    return reply.code(201).send({ block })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'ASSOCIATION_NOT_FOUND') {
        return reply.code(404).send({ error: 'Association not found', statusCode: 404 })
      }
      if (err.name === 'ZodError') {
        return reply.code(400).send({ error: 'Invalid block content', statusCode: 400, details: err.message })
      }
    }
    throw err
  }
}

export async function handleUpdateBlock(
  request: FastifyRequest<{ Params: { id: string; blockId: string }; Body: UpdateBlockInput }>,
  reply: FastifyReply,
) {
  const id = parseId(request.params.id)
  const blockId = parseId(request.params.blockId)
  if (id === null || blockId === null) {
    return reply.code(400).send({ error: 'Invalid id', statusCode: 400 })
  }
  try {
    const block = await updateBlock(id, blockId, request.body)
    return reply.send({ block })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'BLOCK_NOT_FOUND') {
        return reply.code(404).send({ error: 'Block not found', statusCode: 404 })
      }
      if (err.message === 'BLOCK_TYPE_CHANGE_REQUIRES_CONTENT') {
        return reply.code(400).send({ error: 'Changing block type requires sending new content', statusCode: 400 })
      }
      if (err.name === 'ZodError') {
        return reply.code(400).send({ error: 'Invalid block content', statusCode: 400, details: err.message })
      }
    }
    throw err
  }
}

export async function handleDeleteBlock(
  request: FastifyRequest<{ Params: { id: string; blockId: string } }>,
  reply: FastifyReply,
) {
  const id = parseId(request.params.id)
  const blockId = parseId(request.params.blockId)
  if (id === null || blockId === null) {
    return reply.code(400).send({ error: 'Invalid id', statusCode: 400 })
  }
  try {
    await deleteBlock(id, blockId)
    return reply.code(204).send()
  } catch (err) {
    if (err instanceof Error && err.message === 'BLOCK_NOT_FOUND') {
      return reply.code(404).send({ error: 'Block not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleReorderBlocks(
  request: FastifyRequest<{ Params: { id: string }; Body: ReorderBlocksInput }>,
  reply: FastifyReply,
) {
  const id = parseId(request.params.id)
  if (id === null) return reply.code(400).send({ error: 'Invalid association id', statusCode: 400 })
  try {
    await reorderBlocks(id, request.body)
    return reply.send({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'BLOCK_REORDER_MISMATCH') {
      return reply.code(400).send({ error: 'Block ids do not match association blocks', statusCode: 400 })
    }
    throw err
  }
}
