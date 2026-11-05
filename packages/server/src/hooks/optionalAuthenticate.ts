import type {FastifyReply, FastifyRequest} from 'fastify'
import {authenticate} from './authenticate.js'

export async function optionalAuthenticate(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    const token = request.cookies['access_token']

    if (!token) return

    await authenticate(request,reply)
}
