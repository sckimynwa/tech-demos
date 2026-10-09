import { localBrowser, Stagehand } from '@browserbasehq/stagehand'
import type {
  ExtractRequest,
  ExtractResponse,
  ExtractedLink,
  LlmExtraction,
} from '../src/domains/extract/types'
import { resolveChromePath } from './chrome'
import { MODEL_SETUP_HINT, resolveModel, type ResolvedModel } from './model'

const NAVIGATION_TIMEOUT_MS = 30_000
const MAX_TEXT_CHARS = 20_000
const MAX_LINKS = 200

export class InvalidUrlError extends Error {}

export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
  let parsed: URL
  try {
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`)
  } catch {
    throw new InvalidUrlError(`Not a valid URL: ${rawUrl}`)
  }
  const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:'
  if (!isHttp) throw new InvalidUrlError('Only http(s) URLs are supported')
  return parsed.toString()
}

async function runLlmExtraction(
  stagehand: Stagehand,
  model: ResolvedModel | null,
  instruction: string | undefined,
): Promise<LlmExtraction | null> {
  if (!instruction) return null
  if (!model) return { status: 'skipped', reason: MODEL_SETUP_HINT }
  try {
    const result = await stagehand.extract(instruction)
    return { status: 'ok', model: model.modelName, extraction: result.data.extraction }
  } catch (error) {
    return { status: 'error', model: model.modelName, message: (error as Error).message }
  }
}

export async function runExtract({ url, instruction }: ExtractRequest): Promise<ExtractResponse> {
  const targetUrl = normalizeUrl(url)
  const trimmedInstruction = instruction?.trim() || undefined
  const model = resolveModel()
  const startedAt = performance.now()

  const executablePath = await resolveChromePath()
  const browser = await localBrowser.launch({ executablePath, headless: true })
  let stagehand: Stagehand | undefined
  try {
    stagehand = await Stagehand.create({ browser, ...(model && { model }) })
    const [page] = await browser.context.pages()
    if (!page) throw new Error('Stagehand browser opened without a page')

    await page.goto(targetUrl, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS })

    const pageData = await page.evaluate(() => ({
      text: document.body?.innerText ?? '',
      links: Array.from(document.querySelectorAll('a[href]'), (anchor) => ({
        href: (anchor as HTMLAnchorElement).href,
        text: (anchor.textContent ?? '').replace(/\s+/g, ' ').trim(),
      })),
    }))
    const snapshot = await page.snapshot()
    const llm = await runLlmExtraction(stagehand, model, trimmedInstruction)

    return {
      url: await page.url(),
      title: await page.title(),
      text: pageData.text.slice(0, MAX_TEXT_CHARS),
      textTruncated: pageData.text.length > MAX_TEXT_CHARS,
      links: dedupeHttpLinks(pageData.links).slice(0, MAX_LINKS),
      accessibilityTree: snapshot.formattedTree,
      llm,
      durationMs: Math.round(performance.now() - startedAt),
    }
  } finally {
    await stagehand?.close().catch(() => undefined)
    await browser.close().catch(() => undefined)
  }
}

function dedupeHttpLinks(links: ExtractedLink[]): ExtractedLink[] {
  const byHref = new Map<string, ExtractedLink>()
  for (const link of links) {
    const isHttpLink = link.href.startsWith('http://') || link.href.startsWith('https://')
    if (isHttpLink && !byHref.has(link.href)) byHref.set(link.href, link)
  }
  return [...byHref.values()]
}
