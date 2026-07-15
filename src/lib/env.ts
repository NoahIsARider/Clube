import type { RuntimeMode } from './types'

export interface RuntimeEnvInput {
  url: string
  key: string
}

export function resolveRuntimeMode(env: RuntimeEnvInput): RuntimeMode {
  return env.url.trim() && env.key.trim() ? 'supabase' : 'demo'
}

export function getRuntimeMode(): RuntimeMode {
  return resolveRuntimeMode({
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  })
}
