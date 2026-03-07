import { describe, it, expect, vi } from 'vitest'
import { emitAgentEvent, subscribeAgentEvent } from '../src/events'

describe('event bus', () => {
  it('calls handler with correct payload', () => {
    const handler = vi.fn()
    const unsub = subscribeAgentEvent('tool:executing', handler)
    emitAgentEvent('tool:executing', { toolName: 'test_tool' })
    expect(handler).toHaveBeenCalledWith({ toolName: 'test_tool' })
    unsub()
  })

  it('does not fire for other event types', () => {
    const handler = vi.fn()
    const unsub = subscribeAgentEvent('tool:done', handler)
    emitAgentEvent('tool:executing', { toolName: 'test_tool' })
    expect(handler).not.toHaveBeenCalled()
    unsub()
  })

  it('unsubscribe stops future events', () => {
    const handler = vi.fn()
    const unsub = subscribeAgentEvent('tool:executing', handler)
    unsub()
    emitAgentEvent('tool:executing', { toolName: 'test_tool' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('multiple subscribers all fire', () => {
    const a = vi.fn()
    const b = vi.fn()
    const unsubA = subscribeAgentEvent('tool:executing', a)
    const unsubB = subscribeAgentEvent('tool:executing', b)
    emitAgentEvent('tool:executing', { toolName: 'test_tool' })
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    unsubA()
    unsubB()
  })
})
