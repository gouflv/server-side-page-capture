import pptr, { Browser, ScreenshotOptions } from 'puppeteer'
import { server } from '..'
import { cleanTemp, mkdirTemp, resolveTempFilePath } from './file'
import { CaptureOptions, CaptureTask } from './typing'

const isHeadFull = process.env.HEAD_FULL ? true : false

export async function captureRunner(task: CaptureTask) {
  const { taskId, jobs, options } = task

  const browser = await launch(options)

  await mkdirTemp(taskId)

  try {
    for (const job of jobs) {
      server.log.debug(`job[${job.index}] start`)
      job.file = await openPageAndCapture(taskId, browser, job, options)
    }
    server.log.info({ task }, 'captureRunner done')
    return task
  } catch (error) {
    cleanTemp(taskId)
    throw error
  } finally {
    if (!isHeadFull) await browser.close()
  }
}

async function launch(options: CaptureOptions) {
  const browser = await pptr.launch({
    headless: !isHeadFull,
    ignoreHTTPSErrors: true,
    executablePath:
      process.env.NODE_ENV === 'production'
        ? '/usr/bin/google-chrome'
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  return browser
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
    const el = await page.waitForSelector(selector)
    if (!el) {
      throw new Error(`Element not found: ${selector}`)
    }
    await el.screenshot(screenshotOptions)
  }

  const page = await browser.newPage()

  page.setDefaultTimeout(10_000)

  await page.setViewport({
    width: options.viewportWidth,
    height: options.viewportHeight
  })

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
    if (!isHeadFull) await page.close()
  }
}
