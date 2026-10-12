import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(1).default(0),
  ALLOWED_ORIGINS: z.string(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

export const env = envSchema.parse(process.env)
