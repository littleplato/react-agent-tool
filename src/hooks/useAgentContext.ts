import { useEffect, useRef } from 'react'

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

    const unregister = navigator.modelContext.registerTool({
      name,
      description,
      inputSchema: { type: 'object' },
      execute: () => Promise.resolve(getValueRef.current()),
      readOnlyHint: true,
    })

    return unregister
  }, [name, description])
}
