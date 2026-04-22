export interface JWTPayload {
  sub: number       // user id
  email: string
  roleId: number
  iat?: number
  exp?: number
}

export interface ApiError {
  error: string
  message?: string
  statusCode: number
}
