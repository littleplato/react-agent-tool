import { describe, it, expect, beforeEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { installPolyfill, _resetPolyfill } from '../src/polyfill'
import { useAgentTool, useAgentContext, useAgentEvent } from '../src/index'
import { useState } from 'react'

beforeEach(() => {
  _resetPolyfill()
  installPolyfill()
})

describe('integration', () => {
  it('full cycle: register via hook → execute via modelContext → state updates', async () => {
    function FlightSearch() {
      const { state } = useAgentTool({
        name: 'search_flights',
        description: 'Search flights',
        inputSchema: { type: 'object' as const },
        execute: async () => ({ flights: ['SIN→NRT 09:00'] }),
      })
      return (
        <div>
          <span data-testid="executing">{String(state.isExecuting)}</span>
          <span data-testid="result">{JSON.stringify(state.lastResult)}</span>
        </div>
      )
    }

    const { getByTestId } = render(<FlightSearch />)

    await act(async () => {
      const tool = navigator.modelContext?.getTools().find(t => t.name === 'search_flights')
      await tool?.execute({})
    })

    await waitFor(() => {
      expect(getByTestId('result').textContent).toBe('{"flights":["SIN→NRT 09:00"]}')
    })
  })

  it('useAgentContext value reflects latest React state', async () => {
    function UserContext() {
      const [name, setName] = useState('Alice')
      useAgentContext('current_user', 'Current user', () => ({ name }))
      return <button onClick={() => setName('Bob')}>change</button>
    }

    const { getByText } = render(<UserContext />)

    await act(async () => { getByText('change').click() })

    const result = await act(async () => {
      const tool = navigator.modelContext?.getTools().find(t => t.name === 'current_user')
      return tool?.execute({})
    })

    expect(result).toEqual({ name: 'Bob' })
  })

  it('useAgentEvent fires when a registered tool executes', async () => {
    const events: string[] = []

    function Watcher() {
      useAgentEvent('tool:done', ({ toolName }) => events.push(toolName))
      return null
    }

    function Tool() {
      useAgentTool({
        name: 'ping',
        description: 'Ping',
        inputSchema: { type: 'object' as const },
        execute: async () => 'pong',
      })
      return null
    }

    render(<><Watcher /><Tool /></>)

    await act(async () => {
      const tool = navigator.modelContext?.getTools().find(t => t.name === 'ping')
      await tool?.execute({})
    })

    expect(events).toContain('ping')
  })
})
