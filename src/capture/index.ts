import { server } from '..'

const bodyJSONSchema = {
  type: 'object',
  required: ['urls'],
  properties: {
    urls: {
      type: 'array',
      items: { type: 'string', format: 'uri' },
      minItems: 1,
      maxItems: 100
    },
    viewportSize: { type: 'string', pattern: '^[0-9]+x[0-9]+$' },
    selector: { type: 'string' },
    imageFormat: { type: 'string', enum: ['png', 'jpeg'] },
    quality: { type: 'integer', minimum: 0, maximum: 100 },
    responseFormat: { type: 'string', enum: ['zip'] }
  }
}

export function register() {
  server.post(
    '/capture',
    {
      schema: {
        body: bodyJSONSchema
      }
    },
    async (request, reply) => {
      return 'capture!'
    }
  )
}
