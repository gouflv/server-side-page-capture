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
    },
    filenames: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 100
    }
  } as Record<keyof CaptureRequestBodyType, any>
}

const defaultOptions: Partial<CaptureOptions> = {
  viewportWidth: 375,
  viewportHeight: 667,
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
  if (options.filenames && options.urls.length !== options.filenames.length) {
    throw new Error('URLs and filenames must be the same length')
  }
}

async function captureController(
  req: FastifyRequest<{
    Body: Partial<CaptureRequestBodyType>
  }>,
  reply: FastifyReply
) {
  server.log.debug({ body: req.body }, 'CaptureController: income')

  const { body } = req
  const options: CaptureOptions = {
    ...defaultOptions,
    ...(body as any)
  }
  if (options.imageFormat === 'png') {
    options.quality = undefined
  }

  captureOptionsValidate(options)

  server.log.debug({ options }, 'CaptureController: options')

  const taskId = generateTaskId()

  try {
    const task: CaptureTask = {
      taskId,
      jobs: options.urls.map((url, index) => ({
        url,
        index,
        filename: options.filenames?.[index],
        status: 'pending'
      })),
      options
    }

    server.log.debug({ task }, 'CaptureOneController: task')

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
  server.log.debug({ query: req.query }, 'CaptureOneController: income')

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

  server.log.debug({ options }, 'CaptureOneController: options')

  const taskId = generateTaskId()

  try {
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

    const captureResult = await captureRunner(task)
    const buffer = await fs.readFile(captureResult.jobs[0].file!)

    reply
      .headers({
        'Content-Type': {
          jpeg: 'image/jpeg',
          png: 'image/png',
          pdf: 'image/pdf'
        }[options.imageFormat],
        'Content-Disposition': `attachment; filename="${taskId}.${options.imageFormat}"`
      })
      .send(buffer)
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
