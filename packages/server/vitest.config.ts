import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => ({
  test: {
    include: ['**/*.{test,spec}.ts'],
    environment: 'node',
    globals: true,
    env: loadEnv(mode, path.resolve(process.cwd(), '../..'), ''),
  },
}))
