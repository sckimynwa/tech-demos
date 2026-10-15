import path from 'node:path'
import {
  Browser,
  ChromeReleaseChannel,
  detectBrowserPlatform,
  getInstalledBrowsers,
  install,
  resolveBuildId,
} from '@puppeteer/browsers'

// Stagehand v4 injects its runtime via CDP `Extensions.loadUnpacked`, which branded
// Google Chrome rejects ("Method not available"). Chrome for Testing allows it.
const CHROME_CACHE_DIR = path.resolve(import.meta.dir, '..', '.browsers')

let chromePathPromise: Promise<string> | undefined

async function installChromeForTesting(): Promise<string> {
  const installed = await getInstalledBrowsers({ cacheDir: CHROME_CACHE_DIR })
  const existing = installed.find((entry) => entry.browser === Browser.CHROME)
  if (existing) return existing.executablePath

  const platform = detectBrowserPlatform()
  if (!platform) throw new Error('Unsupported platform for Chrome for Testing; set CHROME_PATH')

  const buildId = await resolveBuildId(Browser.CHROME, platform, ChromeReleaseChannel.STABLE)
  console.log(`[chrome] downloading Chrome for Testing ${buildId} into .browsers/ …`)
  const result = await install({ browser: Browser.CHROME, buildId, cacheDir: CHROME_CACHE_DIR })
  console.log(`[chrome] ready: ${result.executablePath}`)
  return result.executablePath
}

export function resolveChromePath(): Promise<string> {
  const configuredPath = process.env.CHROME_PATH
  if (configuredPath) return Promise.resolve(configuredPath)
  chromePathPromise ??= installChromeForTesting().catch((error) => {
    chromePathPromise = undefined
    throw error
  })
  return chromePathPromise
}
