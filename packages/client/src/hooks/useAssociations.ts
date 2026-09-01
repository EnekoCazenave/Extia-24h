import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type {
  CreateAssociationInput,
  UpdateAssociationInput,
  CreateBlockInput,
  UpdateBlockInput,
  ReorderBlocksInput,
  BlockTypeLiteral,
} from '@extia-gaming/shared'

export interface AssociationBlock {
  id: number
  associationId: number
  type: BlockTypeLiteral
  sortOrder: number
  content: Record<string, unknown>
}

export interface Association {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  published: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  blocks: AssociationBlock[]
}

export interface AdminAssociationSummary {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  published: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count: { blocks: number }
}

export function useAssociations() {
  return useQuery({
    queryKey: ['associations'],
    queryFn: async () => {
      const res = await api.get<{ associations: Association[] }>('/api/associations')
      return res.data.associations
    },
  })
}

export function useAssociation(slug: string) {
  return useQuery({
    queryKey: ['associations', slug],
    enabled: slug.length > 0,
    queryFn: async () => {
      const res = await api.get<{ association: Association }>(`/api/associations/${slug}`)
      return res.data.association
    },
  })
}

export function useAdminAssociations() {
  return useQuery({
    queryKey: ['admin', 'associations'],
    queryFn: async () => {
      const res = await api.get<{ associations: AdminAssociationSummary[] }>('/api/admin/associations')
      return res.data.associations
    },
  })
}

export function useAdminAssociation(id: number) {
  return useQuery({
    queryKey: ['admin', 'associations', id],
    enabled: id > 0,
    queryFn: async () => {
      const res = await api.get<{ association: Association }>(`/api/admin/associations/${id}`)
      return res.data.association
    },
  })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['admin', 'associations'] })
  qc.invalidateQueries({ queryKey: ['associations'] })
}

export function useCreateAssociation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAssociationInput) => {
      const res = await api.post<{ association: Association }>('/api/admin/associations', data)
      return res.data.association
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateAssociation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAssociationInput }) => {
      const res = await api.put<{ association: Association }>(`/api/admin/associations/${id}`, data)
      return res.data.association
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteAssociation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/admin/associations/${id}`)
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useCreateBlock(associationId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateBlockInput) => {
      const res = await api.post<{ block: AssociationBlock }>(
        `/api/admin/associations/${associationId}/blocks`,
        data,
      )
      return res.data.block
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateBlock(associationId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ blockId, data }: { blockId: number; data: UpdateBlockInput }) => {
      const res = await api.put<{ block: AssociationBlock }>(
        `/api/admin/associations/${associationId}/blocks/${blockId}`,
        data,
      )
      return res.data.block
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteBlock(associationId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (blockId: number) => {
      await api.delete(`/api/admin/associations/${associationId}/blocks/${blockId}`)
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useReorderBlocks(associationId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ReorderBlocksInput) => {
      await api.post(`/api/admin/associations/${associationId}/blocks/reorder`, data)
    },
    onSuccess: () => invalidateAll(qc),
  })
}
