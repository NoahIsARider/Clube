import { resolveRuntimeMode } from './env'

describe('resolveRuntimeMode', () => {
  it('falls back to demo mode when supabase env is missing', () => {
    expect(resolveRuntimeMode({ url: '', key: '' })).toBe('demo')
  })

  it('uses supabase mode when both env values exist', () => {
    expect(resolveRuntimeMode({ url: 'https://demo.supabase.co', key: 'anon-key' })).toBe(
      'supabase',
    )
  })
})
