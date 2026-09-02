import type {FastifyReply, FastifyRequest} from 'fastify'
import type {JWTPayload} from '@extia-gaming/shared'

export async function optionalAuthenticate(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    const token = request.cookies['access_token']

    if (!token) return

    try {
        request.user = request.server.jwt.verify<JWTPayload>(token)
    } catch {
        reply.code(401).send({error: 'Token invalid or expired', statusCode: 401})
    }
}
