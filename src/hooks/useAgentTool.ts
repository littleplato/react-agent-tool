import { useEffect, useRef, useState } from 'react'
import type { JsonSchema, ToolDefinition, AgentToolState, InferInput } from '../types'
import { subscribeAgentEvent } from '../events'

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

    const unregister = navigator.modelContext.registerTool({
      name,
      description,
      inputSchema,
      execute: input => executeRef.current(input as InferInput<T>),
    })

    return unregister
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
