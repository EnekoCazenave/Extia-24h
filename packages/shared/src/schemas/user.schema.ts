import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  login: z.string(),
  email: z.string().email(),
  firstname: z.string(),
  lastname: z.string(),
  intern: z.boolean(),
  roleId: z.number(),
})

export const UserPublicSchema = UserSchema.omit({ roleId: true }).extend({
  role: z.object({ id: z.number(), name: z.string() }),
})

export type User = z.infer<typeof UserSchema>
export type UserPublic = z.infer<typeof UserPublicSchema>
