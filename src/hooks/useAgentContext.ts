import { useEffect, useRef } from 'react'
import { toCleanup } from './utils'

export function useAgentContext(
  name: string,
  description: string,
  getValue: () => unknown,
): void {
  // Stabilise getValue — stale closure never served to the agent
  const getValueRef = useRef(getValue)
  getValueRef.current = getValue

  useEffect(() => {
    if (!navigator.modelContext) return

    let result: ReturnType<typeof navigator.modelContext.registerTool>
    try {
      result = navigator.modelContext.registerTool({
        name,
        description,
        inputSchema: { type: 'object' },
        execute: () => Promise.resolve(getValueRef.current()),
        readOnlyHint: true,
      })
    } catch (e) {
      // Native API may throw InvalidStateError on StrictMode double-registration.
      // The tool is still registered from the first call — safe to ignore.
      if (e instanceof DOMException && e.name === 'InvalidStateError') return
      throw e
    }

    return toCleanup(result)
  }, [name, description])
}
