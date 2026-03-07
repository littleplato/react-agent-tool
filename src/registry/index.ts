import type { ToolDefinition } from '../types'

const tools = new Map<string, ToolDefinition>()

export function registerTool(definition: ToolDefinition): () => void {
  tools.set(definition.name, definition)
  return () => tools.delete(definition.name)
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
