import { z } from 'zod'

export const RegisterSchema = z.object({
  login: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstname: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  intern: z.boolean().default(false),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  // body is empty — refresh token is in httpOnly cookie
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
