import type { ToolDefinition } from '../types'
import { emitAgentEvent } from '../events'

const tools = new Map<string, ToolDefinition>()

export function registerTool(definition: ToolDefinition): void {
  const wrapped: ToolDefinition = {
    ...definition,
    execute: async input => {
      emitAgentEvent('tool:executing', { toolName: definition.name })
      try {
        const result = await definition.execute(input)
        emitAgentEvent('tool:done', { toolName: definition.name, result })
        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        emitAgentEvent('tool:error', { toolName: definition.name, error: err })
        throw err
      }
    },
  }
  tools.set(definition.name, wrapped)
}

export function unregisterTool(name: string): void {
  tools.delete(name)
}

export function getTools(): readonly ToolDefinition[] {
  return Array.from(tools.values())
}

export function clearRegistry(): void {
  tools.clear()
}
