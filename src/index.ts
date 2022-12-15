import fastify from 'fastify'
import * as CaptureController from './capture/controller'

export const server = fastify({
  logger: {
    level: 'debug'
  }
})

CaptureController.register()

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
