import type { Prisma } from '@prisma/client'
import { ScoringError } from '@extia-gaming/shared'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const uploadsDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url))
const uploadPattern = /^\/uploads\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|jpeg|gif|webp))$/i

export function isImageContent(bytes: Buffer): boolean {
  return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
    (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)) ||
    (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP')
}

export async function requireUploadedProof(tx: Prisma.TransactionClient, proofUrl?: string | null) {
  const settings = await tx.siteSettings.findUnique({ where: { id: 1 } })
  if (!settings?.proofRequired) return
  const filename = proofUrl?.match(uploadPattern)?.[1]
  if (filename) {
    try {
      const bytes = await fs.readFile(path.join(uploadsDirectory, filename))
      if (bytes.length > 0 && isImageContent(bytes)) return
    } catch { /* Missing uploads cannot validate a declaration. */ }
  }
  throw new ScoringError("Une capture d’écran doit être uploadée avant de valider la déclaration.")
}
