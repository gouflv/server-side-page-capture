import fs from 'node:fs/promises'
import path from 'path'

export function getTempDir(taskId: string) {
  return `/tmp/app_server_side_page_capture/${taskId}`
}

export async function mkdirTemp(taskId: string) {
  const tempDir = getTempDir(taskId)
  console.info(`mkdir ${tempDir}`)
  await fs.mkdir(tempDir, { recursive: true })
}

export function resolveTempFilePath(taskId: string, fileName: string) {
  return path.resolve(getTempDir(taskId), fileName)
}

export function packageImages(taskId: string) {}
