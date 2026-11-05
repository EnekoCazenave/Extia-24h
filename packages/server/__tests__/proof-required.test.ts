import {beforeEach, describe, expect, it, vi} from 'vitest'
const readFile = vi.hoisted(() => vi.fn())
vi.mock('node:fs/promises', () => ({default:{readFile}}))
import {requireUploadedProof} from '../src/services/proof.service.js'

describe('Required uploaded screenshots', () => {
  const tx = (required: boolean) => ({siteSettings:{findUnique:vi.fn().mockResolvedValue({proofRequired:required})}}) as never
  beforeEach(() => vi.resetAllMocks())
  it('keeps proof optional during testing', async () => {
    await expect(requireUploadedProof(tx(false),undefined)).resolves.toBeUndefined()
    expect(readFile).not.toHaveBeenCalled()
  })
  it.each([undefined,'','https://example.com/proof.png','/uploads/../../secret.png','/uploads/fake.png'])('rejects an unuploaded proof %s', async value => {
    await expect(requireUploadedProof(tx(true),value)).rejects.toThrow('capture')
    expect(readFile).not.toHaveBeenCalled()
  })
  const url = '/uploads/00000000-0000-4000-8000-000000000001.png'
  it('rejects missing files and arbitrary non-image contents', async () => {
    readFile.mockRejectedValueOnce(new Error('ENOENT')).mockResolvedValueOnce(Buffer.alloc(0)).mockResolvedValueOnce(Buffer.from('hello'))
    for(let i=0;i<3;i++) await expect(requireUploadedProof(tx(true),url)).rejects.toThrow('capture')
  })
  it('accepts an existing image upload', async () => {
    readFile.mockResolvedValue(Buffer.from([137,80,78,71,13,10,26,10,0]))
    await expect(requireUploadedProof(tx(true),url)).resolves.toBeUndefined()
  })
})
