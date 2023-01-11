import { FastifyReply, FastifyRequest } from 'fastify'
import fs from 'node:fs/promises'
import uuid from 'short-uuid'
import { server } from '..'
import { cleanTemp, packageTaskFilesToBuffer } from './file'
import { captureRunner } from './pptr'
import {
  CaptureBaseType,
  CaptureOptions,
  CaptureRequestBodyType,
  CaptureRequestQuerystringType,
  CaptureTask
} from './typing'

const commonSchemaProperties: Record<keyof CaptureBaseType, any> = {
  viewportWidth: { type: 'number' },
  viewportHeight: { type: 'number' },
  selector: { type: 'string' },
  imageFormat: { type: 'string', enum: ['jpeg', 'png', 'pdf'] },
  quality: { type: 'integer', minimum: 0, maximum: 100 },
  responseFormat: { type: 'string', enum: ['zip'] }
}

const queryStringSchema = {
  type: 'object',
  required: ['url'],
  properties: {
    ...commonSchemaProperties,
    url: { type: 'string', format: 'uri' }
  } as Record<keyof CaptureRequestQuerystringType, any>
}

const bodyJSONSchema = {
  type: 'object',
  required: ['urls'],
  properties: {
    ...commonSchemaProperties,
    urls: {
      type: 'array',
      items: { type: 'string', format: 'uri' },
      minItems: 1,
      maxItems: 100
    }
  } as Record<keyof CaptureRequestBodyType, any>
}

const defaultOptions: Partial<CaptureOptions> = {
  viewportWidth: 750,
  viewportHeight: 1334,
  imageFormat: 'jpeg',
  quality: 80,
  responseFormat: 'zip'
}

function generateTaskId() {
  return uuid().new()
}

function captureOptionsValidate(options: CaptureOptions) {
  if (options.imageFormat === 'pdf' && options.selector) {
    throw new Error('PDF format does not support selector')
  }
}

async function captureController(
  req: FastifyRequest<{
    Body: Partial<CaptureRequestBodyType>
  }>,
  reply: FastifyReply
) {
  const { body } = req

  const options: CaptureOptions = {
    ...defaultOptions,
    ...(body as any)
  }

  if (options.imageFormat === 'png') {
    options.quality = undefined
  }

  captureOptionsValidate(options)

  server.log.info({ body: req.body }, 'CaptureController: income')
  server.log.info({ options }, 'CaptureController: options')

  const taskId = generateTaskId()

  const task: CaptureTask = {
    taskId,
    jobs: options.urls.map((url, index) => ({
      url: options.urls[0],
      index,
      status: 'pending'
    })),
    options
  }

  server.log.info({ task }, 'CaptureOneController: task')

  try {
    const captureResult = await captureRunner(task)
    const buffer = await packageTaskFilesToBuffer(captureResult)

    reply
      .headers({
        'Content-Type': {
          zip: 'application/zip; charset=utf-8'
        }[options.responseFormat],
        'Content-Disposition': `attachment; filename="${taskId}.zip"`
      })
      .send(buffer)
  } catch (error) {
    throw error
  } finally {
    cleanTemp(taskId)
  }
}

async function captureOneController(
  req: FastifyRequest<{ Querystring: CaptureRequestQuerystringType }>,
  reply: FastifyReply
) {
  const { query } = req

  const options: CaptureOptions = {
    ...defaultOptions,
    ...(query as any),
    urls: [query.url]
  }

  if (options.imageFormat === 'png') {
    options.quality = undefined
  }

  captureOptionsValidate(options)

  server.log.info({ query: req.query }, 'CaptureOneController: income')
  server.log.info({ options }, 'CaptureOneController: options')

  const taskId = generateTaskId()

  const task: CaptureTask = {
    taskId,
    jobs: [
      {
        url: options.urls[0],
        index: 0,
        status: 'pending'
      }
    ],
    options
  }

  try {
    const captureResult = await captureRunner(task)

    reply.headers({
      'Content-Type': {
        jpeg: 'application/jpeg; charset=utf-8',
        png: 'application/png; charset=utf-8',
        pdf: 'application/pdf; charset=utf-8'
      }[options.imageFormat],
      'Content-Disposition': `attachment; filename="${taskId}.${options.imageFormat}"`
    })

    const buffer = await fs.readFile(captureResult.jobs[0].file!)
    reply.send(buffer)
  } catch (error) {
    throw error
  } finally {
    cleanTemp(taskId)
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
    captureController
  )
  server.get(
    '/capture-one',
    {
      schema: {
        querystring: queryStringSchema
      }
    },
    captureOneController
  )
}
