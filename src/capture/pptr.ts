import fs from 'node:fs/promises'
import path from 'path'
import pptr, { Browser, KnownDevices, ScreenshotOptions } from 'puppeteer'
import { CaptureOptions, CaptureTask } from './typing'

const WAIT_FOR_TIMEOUT = 1000 * 10

export async function captureRunner(task: CaptureTask) {
  const { taskId, jobs: job, options } = task

  const browser = await launch(options)

  await mkdirTemp(taskId)

  try {
    const result = await Promise.all(
      job.map((j) => openPageAndCapture(taskId, browser, j, options))
    )
    console.log(result)

    return task
  } catch (error) {
    throw error
  } finally {
    await browser.close()
  }
}

async function launch(options: CaptureOptions) {
  const browser = await pptr.launch({
    headless: true,
    ignoreHTTPSErrors: true
    // defaultViewport: {
    //   width: options.viewportWidth,
    //   height: options.viewportHeight
    // },
    // args: [`--window-size=${options.viewportWidth},${options.viewportHeight}`]
  })
  return browser
}

function getTempDir(taskId: string) {
  return `/tmp/app_server_side_page_capture/${taskId}`
}

async function mkdirTemp(taskId: string) {
  const tempDir = getTempDir(taskId)
  console.info(`mkdir ${tempDir}`)
  await fs.mkdir(tempDir, { recursive: true })
}

function resolveTempFilePath(taskId: string, fileName: string) {
  return path.resolve(getTempDir(taskId), fileName)
}

async function openPageAndCapture(
  taskId: string,
  browser: Browser,
  job: CaptureTask['jobs'][number],
  options: CaptureOptions
) {
  const filePath = resolveTempFilePath(
    taskId,
    `${job.index}.${options.imageFormat}`
  )

  const screenshotOptions: ScreenshotOptions = {
    path: filePath,
    type: options.imageFormat,
    quality: options.quality
  }

  async function captureFull() {
    await page.screenshot({ ...screenshotOptions, fullPage: true })
  }

  async function captureElement(selector: string) {
    await page.waitForSelector(selector, { timeout: WAIT_FOR_TIMEOUT })
    const el = await page.$(selector)
    if (!el) {
      throw new Error(`Element not found: ${selector}`)
    }
    await el.screenshot(screenshotOptions)
  }

  const page = await browser.newPage()

  page.setDefaultTimeout(WAIT_FOR_TIMEOUT)

  page.emulate(KnownDevices['iPhone 6'])

  try {
    await page.goto(job.url, { waitUntil: 'networkidle0' })

    if (options.selector) {
      await captureElement(options.selector)
    } else {
      await captureFull()
    }

    return filePath
  } catch (error) {
    throw error
  } finally {
    await page.close()
  }
}
