import { z } from 'zod';
export const RegisterSchema = z.object({
    login: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    firstname: z.string().min(1).max(100),
    lastname: z.string().min(1).max(100),
    intern: z.boolean().default(false),
    consentAccepted: z.literal(true, {
        errorMap: () => ({ message: 'Vous devez accepter la politique de confidentialité' }),
    }),
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
//# sourceMappingURL=auth.schema.js.map