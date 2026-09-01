import { z } from 'zod'

export const BlockTypeEnum = z.enum([
  'HEADING',
  'TEXT',
  'IMAGE',
  'VIDEO',
  'CTA_BUTTON',
  'PROGRESS_BAR',
  'DONATION_LINK',
  'QUOTE',
])
export type BlockTypeLiteral = z.infer<typeof BlockTypeEnum>

const externalUrl = z.string().url().max(2000)
const localOrExternalUrl = z.string().min(1).max(2000)

export const HeadingContentSchema = z.object({
  text: z.string().min(1).max(500),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

export const TextContentSchema = z.object({
  html: z.string().min(1).max(50000),
})

export const ImageContentSchema = z.object({
  url: localOrExternalUrl,
  alt: z.string().max(500).default(''),
  caption: z.string().max(500).optional(),
})

export const VideoContentSchema = z.object({
  url: externalUrl,
  provider: z.enum(['youtube', 'twitch', 'custom']),
})

export const CtaButtonContentSchema = z.object({
  label: z.string().min(1).max(100),
  url: externalUrl,
  style: z.enum(['primary', 'secondary']).default('primary'),
})

export const ProgressBarContentSchema = z.object({
  current: z.number().min(0),
  goal: z.number().min(1),
  label: z.string().max(200).optional(),
  unit: z.string().max(20).optional(),
})

export const DonationLinkContentSchema = z.object({
  label: z.string().min(1).max(100),
  url: externalUrl,
})

export const QuoteContentSchema = z.object({
  text: z.string().min(1).max(2000),
  author: z.string().max(200).optional(),
})

export const BlockContentByType = {
  HEADING: HeadingContentSchema,
  TEXT: TextContentSchema,
  IMAGE: ImageContentSchema,
  VIDEO: VideoContentSchema,
  CTA_BUTTON: CtaButtonContentSchema,
  PROGRESS_BAR: ProgressBarContentSchema,
  DONATION_LINK: DonationLinkContentSchema,
  QUOTE: QuoteContentSchema,
} as const

export function validateBlockContent(type: BlockTypeLiteral, content: unknown) {
  return BlockContentByType[type].parse(content)
}

export const CreateAssociationSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  logoUrl: z.string().min(1).max(2000).optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const UpdateAssociationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  logoUrl: z.string().min(1).max(2000).nullable().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const CreateBlockSchema = z.object({
  type: BlockTypeEnum,
  sortOrder: z.number().int().min(0).optional(),
  content: z.record(z.unknown()),
})

export const UpdateBlockSchema = z.object({
  type: BlockTypeEnum.optional(),
  sortOrder: z.number().int().min(0).optional(),
  content: z.record(z.unknown()).optional(),
})

export const ReorderBlocksSchema = z.object({
  blockIds: z.array(z.number().int().positive()),
})

export type CreateAssociationInput = z.infer<typeof CreateAssociationSchema>
export type UpdateAssociationInput = z.infer<typeof UpdateAssociationSchema>
export type CreateBlockInput = z.infer<typeof CreateBlockSchema>
export type UpdateBlockInput = z.infer<typeof UpdateBlockSchema>
export type ReorderBlocksInput = z.infer<typeof ReorderBlocksSchema>

export type HeadingContent = z.infer<typeof HeadingContentSchema>
export type TextContent = z.infer<typeof TextContentSchema>
export type ImageContent = z.infer<typeof ImageContentSchema>
export type VideoContent = z.infer<typeof VideoContentSchema>
export type CtaButtonContent = z.infer<typeof CtaButtonContentSchema>
export type ProgressBarContent = z.infer<typeof ProgressBarContentSchema>
export type DonationLinkContent = z.infer<typeof DonationLinkContentSchema>
export type QuoteContent = z.infer<typeof QuoteContentSchema>
