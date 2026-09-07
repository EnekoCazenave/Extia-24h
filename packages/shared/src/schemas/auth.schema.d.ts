import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    login: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    firstname: z.ZodString;
    lastname: z.ZodString;
    intern: z.ZodDefault<z.ZodBoolean>;
    consentAccepted: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    login: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    intern: boolean;
    consentAccepted: true;
}, {
    login: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    consentAccepted: true;
    intern?: boolean | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
