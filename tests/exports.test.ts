import { describe, it, expect } from 'vitest'
import * as lib from '../src/index'

describe('public exports', () => {
  it('exports the three hooks', () => {
    expect(typeof lib.useAgentTool).toBe('function')
    expect(typeof lib.useAgentContext).toBe('function')
    expect(typeof lib.useAgentEvent).toBe('function')
  })

  it('exports installPolyfill', () => {
    expect(typeof lib.installPolyfill).toBe('function')
  })

  it('does not export registry internals', () => {
    const pub = lib as Record<string, unknown>
    expect(pub['registerTool']).toBeUndefined()
    expect(pub['unregisterTool']).toBeUndefined()
    expect(pub['getTools']).toBeUndefined()
    expect(pub['clearRegistry']).toBeUndefined()
    expect(pub['_resetPolyfill']).toBeUndefined()
    expect(pub['emitAgentEvent']).toBeUndefined()
  })
})
