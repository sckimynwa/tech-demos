import type { ExtractErrorResponse, ExtractRequest, ExtractResponse } from '../types'

export async function postExtract(request: ExtractRequest): Promise<ExtractResponse> {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const payload = (await response.json().catch(() => null)) as
    | ExtractResponse
    | ExtractErrorResponse
    | null
  if (!response.ok || !payload || 'error' in payload) {
    const message = payload && 'error' in payload ? payload.error : `Request failed (${response.status})`
    throw new Error(message)
  }
  return payload
}
