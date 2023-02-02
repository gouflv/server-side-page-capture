import pptr, { Browser, Page, PDFOptions, ScreenshotOptions } from 'puppeteer'
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

      const page = await openPage(browser, options)

      job.file = await createCapture(options, page, taskId, job)
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

async function openPage(browser: Browser, options: CaptureOptions) {
  const page = await browser.newPage()

  page.setDefaultTimeout(10_000)

  await page.setViewport({
    width: options.viewportWidth,
    height: options.viewportHeight
  })

  return page
}

async function createCapture(
  options: CaptureOptions,
  page: Page,
  taskId: string,
  job: CaptureTask['jobs'][number]
) {
  const filePath = resolveTempFilePath(
    taskId,
    `${job.filename || job.index}.${options.imageFormat}`
  )

  async function getPageHeight() {
    return await page.evaluate(() => document.body.scrollHeight)
  }

  async function captureFull(opts: ScreenshotOptions) {
    await page.setViewport({
      width: options.viewportWidth,
      height: await getPageHeight()
    })
    await page.screenshot({ ...opts, fullPage: true })
  }

  async function captureElement(selector: string, opts: ScreenshotOptions) {
    const el = await page.waitForSelector(selector)
    if (!el) {
      throw new Error(`Element not found: ${selector}`)
    }
    await el.screenshot(opts)
  }

  try {
    await page.goto(job.url, { waitUntil: 'networkidle0' })

    if (options.imageFormat === 'pdf') {
      const pdfOptions: PDFOptions = {
        path: filePath,
        width: options.viewportWidth,
        printBackground: true
      }
      await page.pdf(pdfOptions)
    } else {
      const screenshotOptions: ScreenshotOptions = {
        path: filePath,
        type: options.imageFormat,
        quality: options.quality
      }

      if (options.selector) {
        await captureElement(options.selector, screenshotOptions)
      } else {
        await captureFull(screenshotOptions)
      }
    }

    return filePath
  } catch (error) {
    throw error
  } finally {
    if (!isHeadFull) await page.close()
  }
}
