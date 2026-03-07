import { registerTool, getTools, clearRegistry } from '../registry'

export function installPolyfill(): void {
  if (navigator.modelContext) return
  Object.defineProperty(navigator, 'modelContext', {
    value: { registerTool, getTools },
    configurable: true,
  })
}

// Test-only escape hatch — never exported from src/index.ts
export function _resetPolyfill(): void {
  Object.defineProperty(navigator, 'modelContext', {
    value: undefined,
    configurable: true,
  })
  clearRegistry()
}
