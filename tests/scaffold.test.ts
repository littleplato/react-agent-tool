import { describe, it, expect } from 'vitest'

describe('scaffold', () => {
  it('runs in jsdom environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('navigator.modelContext is absent by default', () => {
    expect((navigator as unknown as Record<string, unknown>)['modelContext']).toBeUndefined()
  })
})
