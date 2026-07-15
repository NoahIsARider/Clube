import { createSupabaseConfig } from './supabase'

describe('createSupabaseConfig', () => {
  it('returns demo client settings when credentials are absent', () => {
    expect(createSupabaseConfig({ url: '', anonKey: '' }).mode).toBe('demo')
  })
})
