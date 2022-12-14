import fastify from 'fastify'
import * as CaptureModule from './capture'

export const server = fastify({
  // logger: true,
})

CaptureModule.register()

server.get('/ping', async (request, reply) => {
  return 'pong!'
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
