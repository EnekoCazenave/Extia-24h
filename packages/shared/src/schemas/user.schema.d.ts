import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodNumber;
    login: z.ZodString;
    email: z.ZodString;
    firstname: z.ZodString;
    lastname: z.ZodString;
    intern: z.ZodBoolean;
    roleId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    login: string;
    email: string;
    firstname: string;
    lastname: string;
    intern: boolean;
    id: number;
    roleId: number;
}, {
    login: string;
    email: string;
    firstname: string;
    lastname: string;
    intern: boolean;
    id: number;
    roleId: number;
}>;
export declare const UserPublicSchema: z.ZodObject<Omit<{
    id: z.ZodNumber;
    login: z.ZodString;
    email: z.ZodString;
    firstname: z.ZodString;
    lastname: z.ZodString;
    intern: z.ZodBoolean;
    roleId: z.ZodNumber;
}, "roleId"> & {
    role: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
    }, {
        id: number;
        name: string;
    }>;
}, "strip", z.ZodTypeAny, {
    login: string;
    email: string;
    firstname: string;
    lastname: string;
    intern: boolean;
    id: number;
    role: {
        id: number;
        name: string;
    };
}, {
    login: string;
    email: string;
    firstname: string;
    lastname: string;
    intern: boolean;
    id: number;
    role: {
        id: number;
        name: string;
    };
}>;
export declare const UpdateProfileSchema: z.ZodObject<{
    login: z.ZodOptional<z.ZodString>;
    firstname: z.ZodOptional<z.ZodString>;
    lastname: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    login?: string | undefined;
    firstname?: string | undefined;
    lastname?: string | undefined;
}, {
    login?: string | undefined;
    firstname?: string | undefined;
    lastname?: string | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type UserPublic = z.infer<typeof UserPublicSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
