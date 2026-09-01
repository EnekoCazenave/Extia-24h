import { z } from 'zod';
export const UserSchema = z.object({
    id: z.number(),
    login: z.string(),
    email: z.string().email(),
    firstname: z.string(),
    lastname: z.string(),
    intern: z.boolean(),
    roleId: z.number(),
});
export const UserPublicSchema = UserSchema.omit({ roleId: true }).extend({
    role: z.object({ id: z.number(), name: z.string() }),
});
export const UpdateProfileSchema = z.object({
    login: z.string().min(3).max(50).optional(),
    firstname: z.string().min(1).max(100).optional(),
    lastname: z.string().min(1).max(100).optional(),
});
//# sourceMappingURL=user.schema.js.map