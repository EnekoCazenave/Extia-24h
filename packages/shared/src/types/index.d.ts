export interface JWTPayload {
    sub: number;
    email: string;
    roleId: number;
    iat?: number;
    exp?: number;
}
export interface ApiError {
    error: string;
    message?: string;
    statusCode: number;
}
