import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { installPolyfill, _resetPolyfill } from '../src/polyfill'
import { useAgentTool } from '../src/hooks/useAgentTool'
import { subscribeAgentEvent } from '../src/events'

const SCHEMA = { type: 'object' } as const

beforeEach(() => {
  _resetPolyfill()
  installPolyfill()
})

function TestTool({
  name = 'test_tool',
  enabled = true,
  execute = async () => 'result',
}: {
  name?: string
  enabled?: boolean
  execute?: () => Promise<unknown>
} = {}) {
  const { state } = useAgentTool({
    name,
    description: 'A test tool',
    inputSchema: SCHEMA,
    execute,
    enabled,
  })
  return (
    <div>
      <span data-testid="executing">{String(state.isExecuting)}</span>
      <span data-testid="result">{JSON.stringify(state.lastResult)}</span>
      <span data-testid="error">{state.error?.message ?? ''}</span>
    </div>
  )
}

function simulateCall(name: string) {
  const tool = navigator.modelContext?.getTools().find((t) => t.name === name)
  return tool?.execute({})
}

describe('useAgentTool', () => {
  it('registers the tool on mount', () => {
    render(<TestTool />)
    expect(navigator.modelContext?.getTools().map((t) => t.name)).toContain('test_tool')
  })

  it('unregisters the tool on unmount', () => {
    const { unmount } = render(<TestTool />)
    unmount()
    expect(navigator.modelContext?.getTools()).toHaveLength(0)
  })

  it('enabled: false does not register the tool', () => {
    render(<TestTool enabled={false} />)
    expect(navigator.modelContext?.getTools()).toHaveLength(0)
  })

  it('enabled: false does not emit an event', () => {
    const handler = vi.fn()
    const unsub = subscribeAgentEvent('tool:executing', handler)
    render(<TestTool enabled={false} />)
    expect(handler).not.toHaveBeenCalled()
    unsub()
  })

  it('changing execute inline does not re-register the tool', async () => {
    let callCount = 0
    const originalRegister = navigator.modelContext!.registerTool.bind(navigator.modelContext)
    navigator.modelContext!.registerTool = (...args) => {
      callCount++
      return originalRegister(...args)
    }

    function Parent() {
      const [n, setN] = useState(0)
      return (
        <>
          <TestTool execute={async () => n} />
          <button onClick={() => setN((x) => x + 1)}>tick</button>
        </>
      )
    }

    const { getByText } = render(<Parent />)
    expect(callCount).toBe(1)
    await act(async () => {
      getByText('tick').click()
    })
    expect(callCount).toBe(1) // still 1 — execute ref updated, no re-register
  })

  it('state.isExecuting is true during execution and false after', async () => {
    let settle!: () => void
    const execute = () =>
      new Promise<string>((resolve) => {
        settle = () => resolve('done')
      })

    const { getByTestId } = render(<TestTool execute={execute} />)
    expect(getByTestId('executing').textContent).toBe('false')

    act(() => {
      simulateCall('test_tool')
    })
    await waitFor(() => expect(getByTestId('executing').textContent).toBe('true'))

    await act(async () => {
      settle()
    })
    await waitFor(() => expect(getByTestId('executing').textContent).toBe('false'))
  })

  it('state.lastResult captures the result', async () => {
    const { getByTestId } = render(<TestTool execute={async () => ({ count: 42 })} />)

    await act(async () => {
      await simulateCall('test_tool')
    })
    expect(getByTestId('result').textContent).toBe('{"count":42}')
  })

  it('state.error captures thrown errors', async () => {
    const execute = async () => {
      throw new Error('boom')
    }
    const { getByTestId } = render(<TestTool execute={execute} />)

    await act(async () => {
      await simulateCall('test_tool')?.catch(() => {})
    })
    expect(getByTestId('error').textContent).toBe('boom')
  })

  it('state.lastResult does not persist across remounts', async () => {
    const { getByTestId, unmount } = render(<TestTool execute={async () => 'first'} />)
    await act(async () => {
      await simulateCall('test_tool')
    })
    expect(getByTestId('result').textContent).toBe('"first"')

    unmount()
    _resetPolyfill()
    installPolyfill()

    const { getByTestId: getByTestId2 } = render(<TestTool execute={async () => 'second'} />)
    expect(getByTestId2('result').textContent).toBe('null')
  })
})
