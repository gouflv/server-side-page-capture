import pptr, { Browser, ScreenshotOptions } from 'puppeteer'
import { server } from '..'
import { cleanTemp, mkdirTemp, resolveTempFilePath } from './file'
import { CaptureOptions, CaptureTask } from './typing'

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
    await cleanTemp(taskId)
    throw error
  } finally {
    await browser.close()
  }
}

async function launch(options: CaptureOptions) {
  const browser = await pptr.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: [`--window-size=${options.viewportWidth},${options.viewportHeight}`]
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
    await page.waitForSelector(selector)
    const el = await page.$(selector)
    if (!el) {
      throw new Error(`Element not found: ${selector}`)
    }
    await el.screenshot(screenshotOptions)
  }

  const page = await browser.newPage()

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
    await page.close()
  }
}
