import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerTool, unregisterTool, getTools, clearRegistry } from '../src/registry'
import { subscribeAgentEvent } from '../src/events'

beforeEach(() => clearRegistry())

describe('registry', () => {
  it('registered tool is retrievable via getTools', () => {
    registerTool({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object' },
      execute: async () => 'ok',
    })
    expect(getTools().map(t => t.name)).toContain('test_tool')
  })

  it('duplicate name: last registration wins', () => {
    registerTool({
      name: 'test_tool',
      description: 'first',
      inputSchema: { type: 'object' },
      execute: async () => 'first',
    })
    registerTool({
      name: 'test_tool',
      description: 'second',
      inputSchema: { type: 'object' },
      execute: async () => 'second',
    })
    const tools = getTools()
    expect(tools).toHaveLength(1)
    expect(tools[0]?.description).toBe('second')
  })

  it('unregisterTool removes the tool', () => {
    registerTool({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object' },
      execute: async () => 'ok',
    })
    unregisterTool('test_tool')
    expect(getTools()).toHaveLength(0)
  })

  it('execute emits tool:executing then tool:done in order', async () => {
    const order: string[] = []
    const unsubExec = subscribeAgentEvent('tool:executing', () => order.push('executing'))
    const unsubDone = subscribeAgentEvent('tool:done', () => order.push('done'))

    registerTool({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object' },
      execute: async () => 'result',
    })

    await getTools()[0]?.execute({})

    expect(order).toEqual(['executing', 'done'])
    unsubExec()
    unsubDone()
  })

  it('execute emits tool:error when the handler throws', async () => {
    const handler = vi.fn()
    const unsub = subscribeAgentEvent('tool:error', handler)

    registerTool({
      name: 'failing_tool',
      description: 'A failing tool',
      inputSchema: { type: 'object' },
      execute: async () => { throw new Error('boom') },
    })

    await expect(getTools()[0]?.execute({})).rejects.toThrow('boom')
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ toolName: 'failing_tool' }),
    )
    unsub()
  })
})
