import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import { env } from '../env.js'

const isDev = env.NODE_ENV === 'development'

export default fp(async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', ...(isDev ? ['http://localhost:3000'] : [])],
        connectSrc: ["'self'", ...(isDev ? ['http://localhost:3000'] : [])],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
})
