import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    globals: true,
    env: loadEnv(mode, path.resolve(process.cwd(), '../..'), ''),
  },
}))
