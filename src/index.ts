import fastify from 'fastify'
import * as CaptureController from './capture/controller'

export const server = fastify({
  logger:
    process.env.NODE_ENV === 'production'
      ? {
          level: 'info'
        }
      : {
          level: 'debug',
          transport: {
            target: 'pino-pretty'
          }
        }
})

CaptureController.register()

server.get('/ping', async () => {
  return 'pong!'
})

server.listen(
  {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080
  },
  (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  }
)
