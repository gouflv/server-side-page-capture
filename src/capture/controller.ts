import { FastifyRequest } from 'fastify'
import uuid from 'short-uuid'
import { server } from '..'
import { captureRunner } from './pptr'
import { CaptureOptions, CaptureRequestBodyType, CaptureTask } from './typing'

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
    viewportWidth: { type: 'integer' },
    viewportHeight: { type: 'integer' },
    selector: { type: 'string' },
    imageFormat: { type: 'string', enum: ['png', 'jpeg'] },
    quality: { type: 'integer', minimum: 0, maximum: 100 },
    responseFormat: { type: 'string', enum: ['zip'] }
  } as Record<keyof CaptureRequestBodyType, any>
}

const defaultOptions: CaptureOptions = {
  urls: [],
  viewportWidth: 750,
  viewportHeight: 1334,
  imageFormat: 'jpeg',
  quality: 80,
  responseFormat: 'zip'
}

function generateTaskId() {
  return uuid().new()
}

async function captureController(
  req: FastifyRequest<{ Body: CaptureRequestBodyType }>
) {
  const { body } = req

  const options: CaptureOptions = {
    ...defaultOptions,
    ...body
  }

  server.log.info({ body: req.body }, 'CaptureController: income')
  server.log.info({ options }, 'CaptureController: options')

  const taskId = generateTaskId()

  const task: CaptureTask = {
    taskId,
    jobs: options.urls.map((url, index) => ({
      url,
      index,
      status: 'pending'
    })),
    options
  }

  server.log.info({ task }, 'CaptureController: task')

  // call pptr to generate images
  await captureRunner(task)

  // package images
  // return zip file

  return 'capture'
}

export function register() {
  server.post(
    '/capture',
    {
      schema: {
        body: bodyJSONSchema
      }
    },
    captureController
  )
}
