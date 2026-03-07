import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useRef, useState } from 'react'
import { installPolyfill, _resetPolyfill } from '../src/polyfill'
import { useAgentContext } from '../src/hooks/useAgentContext'

beforeEach(() => {
  _resetPolyfill()
  installPolyfill()
})

function simulateCall(name: string) {
  const tool = navigator.modelContext?.getTools().find(t => t.name === name)
  return tool?.execute({})
}

describe('useAgentContext', () => {
  it('registers the context on mount', () => {
    function TestContext() {
      useAgentContext('current_user', 'The current user', () => ({ name: 'Jerrick' }))
      return null
    }
    render(<TestContext />)
    expect(navigator.modelContext?.getTools().map(t => t.name)).toContain('current_user')
  })

  it('unregisters the context on unmount', () => {
    function TestContext() {
      useAgentContext('current_user', 'The current user', () => null)
      return null
    }
    const { unmount } = render(<TestContext />)
    unmount()
    expect(navigator.modelContext?.getTools()).toHaveLength(0)
  })

  it('registered tool has readOnlyHint: true', () => {
    function TestContext() {
      useAgentContext('current_user', 'The current user', () => null)
      return null
    }
    render(<TestContext />)
    const tool = navigator.modelContext?.getTools().find(t => t.name === 'current_user')
    expect(tool?.readOnlyHint).toBe(true)
  })

  it('getValue is snapshotted at call time, not at registration time', async () => {
    function TestContext({ value }: { value: string }) {
      useAgentContext('current_user', 'The current user', () => value)
      return null
    }

    const { rerender } = render(<TestContext value="initial" />)
    rerender(<TestContext value="updated" />)

    const result = await act(async () => simulateCall('current_user'))
    expect(result).toBe('updated')
  })

  it('changing getValue inline does not re-register the tool', async () => {
    let callCount = 0
    const originalRegister = navigator.modelContext!.registerTool.bind(navigator.modelContext)
    navigator.modelContext!.registerTool = (...args) => {
      callCount++
      return originalRegister(...args)
    }

    function TestContext() {
      const [n, setN] = useState(0)
      useAgentContext('current_user', 'The current user', () => n)
      return <button onClick={() => setN(x => x + 1)}>tick</button>
    }

    const { getByText } = render(<TestContext />)
    expect(callCount).toBe(1)
    await act(async () => { getByText('tick').click() })
    expect(callCount).toBe(1)
  })

  it('multiple contexts coexist independently', () => {
    function TestContext() {
      useAgentContext('current_user', 'The current user', () => ({ name: 'Jerrick' }))
      useAgentContext('app_state', 'Current app state', () => ({ page: 'home' }))
      return null
    }
    render(<TestContext />)
    const names = navigator.modelContext?.getTools().map(t => t.name)
    expect(names).toContain('current_user')
    expect(names).toContain('app_state')
  })
})
