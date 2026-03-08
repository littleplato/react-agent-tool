import { describe, it, expect, beforeEach } from 'vitest'
import { registerTool, unregisterTool, getTools, clearRegistry } from '../src/registry'

beforeEach(() => clearRegistry())

describe('registry', () => {
  it('registered tool is retrievable via getTools', () => {
    registerTool({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object' },
      execute: async () => 'ok',
    })
    expect(getTools().map((t) => t.name)).toContain('test_tool')
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

  it('execute calls the registered handler and returns the result', async () => {
    registerTool({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object' },
      execute: async () => 'result',
    })

    const result = await getTools()[0]?.execute({})
    expect(result).toBe('result')
  })

  it('execute propagates errors from the handler', async () => {
    registerTool({
      name: 'failing_tool',
      description: 'A failing tool',
      inputSchema: { type: 'object' },
      execute: async () => {
        throw new Error('boom')
      },
    })

    await expect(getTools()[0]?.execute({})).rejects.toThrow('boom')
  })
})
