import fs from 'node:fs/promises'
import path from 'path'
import { server } from '..'
import { CaptureTask } from './typing'
import zip from 'adm-zip'

export function getTempDir(taskId: string) {
  return `/tmp/app_server_side_page_capture/${taskId}`
}

export async function mkdirTemp(taskId: string) {
  const tempDir = getTempDir(taskId)
  server.log.info(`mkdir: ${tempDir}`)
  await fs.mkdir(tempDir, { recursive: true })
}

export async function cleanTemp(taskId: string) {
  const tempDir = getTempDir(taskId)
  server.log.info(`cleanTemp: ${tempDir}`)
  await fs.rm(tempDir, { recursive: true, force: true })
}

export function resolveTempFilePath(taskId: string, fileName: string) {
  return path.resolve(getTempDir(taskId), fileName)
}

export function packageTaskFilesToBuffer(task: CaptureTask) {
  const { taskId, jobs } = task

  const zipFile = new zip()
  jobs.forEach((job) => {
    zipFile.addLocalFile(job.file!)
  })

  // local
  // const zipFilePath = resolveTempFilePath(taskId, 'images.zip')
  // zipFile.writeZip(zipFilePath)

  return zipFile.toBufferPromise()
}
