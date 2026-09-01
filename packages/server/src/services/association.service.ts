import { prisma } from '../lib/prisma.js'
import {
  validateBlockContent,
  type CreateAssociationInput,
  type UpdateAssociationInput,
  type CreateBlockInput,
  type UpdateBlockInput,
  type ReorderBlocksInput,
  type BlockTypeLiteral,
} from '@extia-gaming/shared'

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
}

async function ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
  const candidateBase = base || 'association'
  let candidate = candidateBase
  let n = 1
  while (true) {
    const existing = await prisma.association.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    n += 1
    candidate = `${candidateBase}-${n}`
  }
}

export async function listPublishedAssociations() {
  return prisma.association.findMany({
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      blocks: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function getAssociationBySlug(slug: string) {
  const association = await prisma.association.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!association || !association.published) throw new Error('ASSOCIATION_NOT_FOUND')
  return association
}

export async function listAllAssociations() {
  return prisma.association.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { blocks: true } } },
  })
}

export async function getAdminAssociation(id: number) {
  const association = await prisma.association.findUnique({
    where: { id },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!association) throw new Error('ASSOCIATION_NOT_FOUND')
  return association
}

export async function createAssociation(data: CreateAssociationInput) {
  const rawSlug = data.slug ?? slugify(data.name)
  const slug = await ensureUniqueSlug(rawSlug)
  return prisma.association.create({
    data: {
      name: data.name,
      slug,
      logoUrl: data.logoUrl ?? null,
      published: data.published ?? false,
      sortOrder: data.sortOrder ?? 0,
    },
  })
}

export async function updateAssociation(id: number, data: UpdateAssociationInput) {
  const existing = await prisma.association.findUnique({ where: { id } })
  if (!existing) throw new Error('ASSOCIATION_NOT_FOUND')

  let slug = existing.slug
  if (data.slug && data.slug !== existing.slug) {
    slug = await ensureUniqueSlug(data.slug, id)
  }

  return prisma.association.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      slug,
      logoUrl: data.logoUrl === undefined ? existing.logoUrl : data.logoUrl,
      published: data.published ?? existing.published,
      sortOrder: data.sortOrder ?? existing.sortOrder,
    },
  })
}

export async function deleteAssociation(id: number) {
  const existing = await prisma.association.findUnique({ where: { id } })
  if (!existing) throw new Error('ASSOCIATION_NOT_FOUND')
  await prisma.association.delete({ where: { id } })
}

export async function createBlock(associationId: number, data: CreateBlockInput) {
  const association = await prisma.association.findUnique({ where: { id: associationId } })
  if (!association) throw new Error('ASSOCIATION_NOT_FOUND')

  const content = validateBlockContent(data.type as BlockTypeLiteral, data.content)

  let sortOrder = data.sortOrder
  if (sortOrder === undefined) {
    const max = await prisma.associationBlock.aggregate({
      where: { associationId },
      _max: { sortOrder: true },
    })
    sortOrder = (max._max.sortOrder ?? -1) + 1
  }

  return prisma.associationBlock.create({
    data: {
      associationId,
      type: data.type,
      sortOrder,
      content,
    },
  })
}

export async function updateBlock(
  associationId: number,
  blockId: number,
  data: UpdateBlockInput,
) {
  const block = await prisma.associationBlock.findUnique({ where: { id: blockId } })
  if (!block || block.associationId !== associationId) throw new Error('BLOCK_NOT_FOUND')

  const nextType = (data.type ?? block.type) as BlockTypeLiteral
  const updateData: {
    type?: typeof block.type
    sortOrder?: number
    content?: ReturnType<typeof validateBlockContent>
  } = {}
  if (data.type !== undefined) updateData.type = data.type
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
  if (data.content !== undefined) {
    updateData.content = validateBlockContent(nextType, data.content)
  } else if (data.type && data.type !== block.type) {
    throw new Error('BLOCK_TYPE_CHANGE_REQUIRES_CONTENT')
  }

  return prisma.associationBlock.update({
    where: { id: blockId },
    data: updateData,
  })
}

export async function deleteBlock(associationId: number, blockId: number) {
  const block = await prisma.associationBlock.findUnique({ where: { id: blockId } })
  if (!block || block.associationId !== associationId) throw new Error('BLOCK_NOT_FOUND')
  await prisma.associationBlock.delete({ where: { id: blockId } })
}

export async function reorderBlocks(associationId: number, data: ReorderBlocksInput) {
  const blocks = await prisma.associationBlock.findMany({
    where: { associationId },
    select: { id: true },
  })
  const existingIds = new Set(blocks.map((b) => b.id))
  if (data.blockIds.length !== blocks.length) throw new Error('BLOCK_REORDER_MISMATCH')
  for (const id of data.blockIds) {
    if (!existingIds.has(id)) throw new Error('BLOCK_REORDER_MISMATCH')
  }

  await prisma.$transaction(
    data.blockIds.map((blockId, index) =>
      prisma.associationBlock.update({
        where: { id: blockId },
        data: { sortOrder: index },
      }),
    ),
  )
}
