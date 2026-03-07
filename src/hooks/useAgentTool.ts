import { useEffect, useRef, useState } from 'react'
import type { JsonSchema, ToolDefinition, AgentToolState, InferInput } from '../types'
import { subscribeAgentEvent } from '../events'
import { toCleanup } from './utils'

export interface UseAgentToolOptions<T extends JsonSchema> {
  name: string
  description: string
  inputSchema: T
  execute: ToolDefinition<T>['execute']
  enabled?: boolean
}

export function useAgentTool<T extends JsonSchema>({
  name,
  description,
  inputSchema,
  execute,
  enabled = true,
}: UseAgentToolOptions<T>): { state: AgentToolState } {
  const executeRef = useRef(execute)
  executeRef.current = execute

  const [state, setState] = useState<AgentToolState>({
    isExecuting: false,
    error: null,
    lastResult: null,
  })

  useEffect(() => {
    if (!enabled || !navigator.modelContext) return

    let result: ReturnType<typeof navigator.modelContext.registerTool>
    try {
      result = navigator.modelContext.registerTool({
        name,
        description,
        inputSchema,
        execute: input => executeRef.current(input as InferInput<T>),
      })
    } catch (e) {
      // Native API may throw InvalidStateError on StrictMode double-registration.
      // The tool is still registered from the first call — safe to ignore.
      if (e instanceof DOMException && e.name === 'InvalidStateError') return
      throw e
    }

    return toCleanup(result)
  }, [name, description, inputSchema, enabled])

  useEffect(() => {
    const unsubs = [
      subscribeAgentEvent('tool:executing', ({ toolName }) => {
        if (toolName !== name) return
        setState(prev => ({ ...prev, isExecuting: true, error: null }))
      }),
      subscribeAgentEvent('tool:done', ({ toolName, result }) => {
        if (toolName !== name) return
        setState(prev => ({ ...prev, isExecuting: false, lastResult: result }))
      }),
      subscribeAgentEvent('tool:error', ({ toolName, error }) => {
        if (toolName !== name) return
        setState(prev => ({ ...prev, isExecuting: false, error }))
      }),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [name])

  return { state }
}
