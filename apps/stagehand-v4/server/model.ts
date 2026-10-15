import type { ModelName } from '@browserbasehq/stagehand'

export type ResolvedModel = { modelName: ModelName; apiKey: string }

const PROVIDER_DEFAULTS = [
  { envKey: 'OPENAI_API_KEY', modelName: 'openai/gpt-5.4-mini' },
  { envKey: 'ANTHROPIC_API_KEY', modelName: 'anthropic/claude-haiku-4-5' },
  { envKey: 'GOOGLE_GENERATIVE_AI_API_KEY', modelName: 'google/gemini-2.5-flash' },
] as const

const PROVIDER_KEY_BY_PREFIX: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
}

export const MODEL_SETUP_HINT =
  'Set OPENAI_API_KEY, ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY (optionally STAGEHAND_MODEL) to run stagehand.extract(instruction).'

export function resolveModel(): ResolvedModel | null {
  const explicitModel = process.env.STAGEHAND_MODEL
  if (explicitModel) {
    const provider = explicitModel.split('/')[0] ?? ''
    const providerEnvKey = PROVIDER_KEY_BY_PREFIX[provider]
    const apiKey =
      process.env.STAGEHAND_MODEL_API_KEY ?? (providerEnvKey ? process.env[providerEnvKey] : undefined)
    return apiKey ? { modelName: explicitModel as ModelName, apiKey } : null
  }

  for (const { envKey, modelName } of PROVIDER_DEFAULTS) {
    const apiKey = process.env[envKey]
    if (apiKey) return { modelName, apiKey }
  }
  return null
}
