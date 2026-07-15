import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getRuntimeMode, resolveRuntimeMode } from './env'

export interface SupabaseConfig {
  mode: 'demo' | 'supabase'
  url: string
  anonKey: string
}

export function createSupabaseConfig(input: { url: string; anonKey: string }): SupabaseConfig {
  return {
    mode: resolveRuntimeMode({ url: input.url, key: input.anonKey }),
    url: input.url,
    anonKey: input.anonKey,
  }
}

export function getSupabaseConfigFromEnv(): SupabaseConfig {
  return {
    mode: getRuntimeMode(),
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  }
}

export function createSupabaseBrowserClient(config: SupabaseConfig): SupabaseClient | null {
  if (config.mode === 'demo') {
    return null
  }

  return createClient(config.url, config.anonKey)
}
