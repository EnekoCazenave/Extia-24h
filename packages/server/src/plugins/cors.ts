import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { env } from '../env.js'

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true, // required for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
})
