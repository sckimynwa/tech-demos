const SYSTEM = `You write deterministic motion-graphic scene JSON for a seek(t) canvas renderer.
Return ONLY JSON (no markdown). Schema:
{
  "id": string,
  "title": string,
  "width": 1280,
  "height": 720,
  "fps": 30,
  "duration": number (4-10),
  "background": "#0c0c0e",
  "accent": "#d6ff3d",
  "ink": "#f4f1ea",
  "grain": 0.07,
  "camera": {
    "zoom": { "keys": [[t, value], ...], "k": 170, "d": 26 },
    "x": { "keys": [[0, 0]] },
    "y": { "keys": [[0, 0]] },
    "rotate": { "keys": [[0, 0]] }
  },
  "shots": [{ "t": number, "label": string }],
  "layers": [
    { "kind": "text", "id": string, "from": number, "to": number,
      "text": string, "x": track, "y": track, "scale": track,
      "fontSize": number, "fontWeight": 400-700, "font": "display"|"mono"|"sans",
      "fill": hex, "align": "left"|"center"|"right", "tracking": number },
    { "kind": "box", "id", "from", "to", "x", "y", "w", "h", "r", "fill", "scale" },
    { "kind": "rule", "id", "from", "to", "x", "y", "w", "h", "fill" },
    { "kind": "cells", "id", "from", "to", "x", "y", "cols", "rows", "size", "gap", "bpm", "fill", "accent" },
    { "kind": "ticks", "id", "from", "to", "y", "count", "fill", "playhead": true }
  ]
}
Rules:
- Coordinates in pixels on 1280x720. Tracks are closed-form springs via keys [[time, value], ...].
- Something new every 2-4 seconds. No gradient backgrounds. No fade-everything-in.
- One accent color. Banned: corner watermarks, glow chrome, generic particle bursts.
- Prefer punchy springs (k 160-280, d 20-28) over linear fades.`

export type LlmCompile = {
  scene: unknown
  source: 'openai' | 'anthropic'
  model: string
}

export async function compileWithLlm(prompt: string): Promise<LlmCompile | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  if (anthropicKey) {
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5'
    const scene = await anthropicJson(anthropicKey, model, prompt)
    return { scene, source: 'anthropic', model }
  }
  if (openaiKey) {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    const scene = await openaiJson(openaiKey, model, prompt)
    return { scene, source: 'openai', model }
  }
  return null
}

async function anthropicJson(key: string, model: string, prompt: string): Promise<unknown> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) {
    throw new Error(`Anthropic ${response.status}: ${await response.text()}`)
  }
  const data = (await response.json()) as { content?: Array<{ text?: string }> }
  return parseJson(data.content?.[0]?.text ?? '')
}

async function openaiJson(key: string, model: string, prompt: string): Promise<unknown> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  })
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`)
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return parseJson(data.choices?.[0]?.message?.content ?? '')
}

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = (fenced?.[1] ?? text).trim()
  return JSON.parse(raw)
}
