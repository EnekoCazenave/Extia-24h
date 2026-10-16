import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'

const tx = vi.hoisted(() => ({
  $executeRaw: vi.fn(),
  role: { findUnique: vi.fn(), create: vi.fn() },
  user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
}))
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
} }))
import { ensureInitialAdmin } from '../src/services/bootstrap.service.js'

describe('Initial administrator', () => {
  const config = { ADMIN_EMAIL: 'admin@example.org', ADMIN_PASSWORD: 'A-long-random-password!123' }
  beforeEach(() => {
    vi.resetAllMocks()
    tx.role.findUnique.mockResolvedValue(null)
    tx.user.findFirst.mockResolvedValue(null)
    tx.user.findUnique.mockResolvedValue(null)
  })

  it('initializes roles and creates an admin with a usable hashed password', async () => {
    expect(await ensureInitialAdmin(config)).toBe('created')
    expect(tx.role.create).toHaveBeenCalledTimes(3)
    const data = tx.user.create.mock.calls[0][0].data
    expect(data).toMatchObject({ email: config.ADMIN_EMAIL, login: 'admin', roleId: 2 })
    expect(data.password).not.toBe(config.ADMIN_PASSWORD)
    expect(await bcrypt.compare(config.ADMIN_PASSWORD, data.password)).toBe(true)
  })

  it('does not create or reset an existing admin even without credentials', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 42 })
    expect(await ensureInitialAdmin({})).toBe('existing')
    expect(tx.user.create).not.toHaveBeenCalled()
  })

  it('does not create a second admin on a subsequent start', async () => {
    await ensureInitialAdmin(config)
    tx.user.findFirst.mockResolvedValue({ id: 42 })
    await ensureInitialAdmin({ ...config, ADMIN_PASSWORD: 'A-different-password!123' })
    expect(tx.user.create).toHaveBeenCalledTimes(1)
  })

  it('rejects a non-admin email collision without promoting the account', async () => {
    tx.user.findUnique.mockResolvedValue({ id: 10 })
    await expect(ensureInitialAdmin(config)).rejects.toThrow('non-admin')
    expect(tx.user.create).not.toHaveBeenCalled()
  })

  it('requires credentials on a fresh database', async () => {
    await expect(ensureInitialAdmin({})).rejects.toThrow('configure ADMIN_EMAIL')
    expect(tx.user.create).not.toHaveBeenCalled()
  })

  it('refuses conflicting role IDs', async () => {
    tx.role.findUnique.mockResolvedValue({ id: 1, name: 'admin' })
    await expect(ensureInitialAdmin(config)).rejects.toThrow('conflicts')
    expect(tx.user.create).not.toHaveBeenCalled()
  })
})
