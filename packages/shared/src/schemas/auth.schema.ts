import { z } from 'zod'

export const RegisterSchema = z.object({
  login: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstname: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  groupId: z.number().int().positive().nullable().optional(),
  intern: z.boolean().default(false),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter le règlement de l’événement" }),
  }),
  statisticsConsent: z.boolean().default(false),
  adultConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'La participation est réservée aux personnes de 18 ans et plus' }),
  }),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
