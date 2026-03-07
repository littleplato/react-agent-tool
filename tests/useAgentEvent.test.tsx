import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useState } from 'react'
import { installPolyfill, _resetPolyfill } from '../src/polyfill'
import { useAgentEvent } from '../src/hooks/useAgentEvent'
import { emitAgentEvent } from '../src/events'

beforeEach(() => {
  _resetPolyfill()
  installPolyfill()
})

describe('useAgentEvent', () => {
  it('calls handler when the event fires', () => {
    const handler = vi.fn()
    function TestComponent() {
      useAgentEvent('tool:executing', handler)
      return null
    }
    render(<TestComponent />)
    act(() => emitAgentEvent('tool:executing', { toolName: 'any_tool' }))
    expect(handler).toHaveBeenCalledWith({ toolName: 'any_tool' })
  })

  it('does not call handler after unmount', () => {
    const handler = vi.fn()
    function TestComponent() {
      useAgentEvent('tool:executing', handler)
      return null
    }
    const { unmount } = render(<TestComponent />)
    unmount()
    act(() => emitAgentEvent('tool:executing', { toolName: 'any_tool' }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not fire for other event types', () => {
    const handler = vi.fn()
    function TestComponent() {
      useAgentEvent('tool:done', handler)
      return null
    }
    render(<TestComponent />)
    act(() => emitAgentEvent('tool:executing', { toolName: 'any_tool' }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('toolName filter: fires only for the named tool', () => {
    const handler = vi.fn()
    function TestComponent() {
      useAgentEvent('tool:executing', handler, 'search_flights')
      return null
    }
    render(<TestComponent />)
    act(() => emitAgentEvent('tool:executing', { toolName: 'get_weather' }))
    expect(handler).not.toHaveBeenCalled()
    act(() => emitAgentEvent('tool:executing', { toolName: 'search_flights' }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('changing handler inline does not cause duplicate calls', async () => {
    // If re-subscription happened on re-render, a single emit would fire the
    // handler more than once (once per subscription). Verify it fires exactly once.
    const handler = vi.fn()
    function TestComponent() {
      const [n, setN] = useState(0)
      useAgentEvent('tool:executing', () => handler(n))
      return <button onClick={() => setN(x => x + 1)}>tick</button>
    }

    const { getByText } = render(<TestComponent />)
    await act(async () => { getByText('tick').click() })
    await act(async () => { getByText('tick').click() })
    act(() => emitAgentEvent('tool:executing', { toolName: 'any_tool' }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('works with no navigator.modelContext installed', () => {
    _resetPolyfill() // remove polyfill — event bus still works independently
    const handler = vi.fn()
    function TestComponent() {
      useAgentEvent('tool:executing', handler)
      return null
    }
    render(<TestComponent />)
    act(() => emitAgentEvent('tool:executing', { toolName: 'any_tool' }))
    expect(handler).toHaveBeenCalled()
  })
})
