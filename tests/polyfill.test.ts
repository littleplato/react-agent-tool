import { describe, it, expect, beforeEach } from 'vitest'
import { installPolyfill, _resetPolyfill } from '../src/polyfill'

beforeEach(() => _resetPolyfill())

describe('polyfill', () => {
  it('installPolyfill sets navigator.modelContext', () => {
    installPolyfill()
    expect(navigator.modelContext).toBeDefined()
  })

  it('installPolyfill exposes registerTool and getTools', () => {
    installPolyfill()
    expect(typeof navigator.modelContext?.registerTool).toBe('function')
    expect(typeof navigator.modelContext?.getTools).toBe('function')
  })

  it('calling installPolyfill twice does not overwrite existing implementation', () => {
    installPolyfill()
    const first = navigator.modelContext
    installPolyfill()
    expect(navigator.modelContext).toBe(first)
  })

  it('_resetPolyfill removes navigator.modelContext', () => {
    installPolyfill()
    _resetPolyfill()
    expect(navigator.modelContext).toBeUndefined()
  })

  it('_resetPolyfill clears registered tools', () => {
    installPolyfill()
    navigator.modelContext?.registerTool({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object' },
      execute: async () => 'ok',
    })
    _resetPolyfill()
    installPolyfill()
    expect(navigator.modelContext?.getTools()).toHaveLength(0)
  })
})
