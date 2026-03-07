import { useEffect, useRef } from 'react'
import type { AgentEventType, AgentEventPayloadMap } from '../types'
import { subscribeAgentEvent } from '../events'

export function useAgentEvent<T extends AgentEventType>(
  type: T,
  handler: (payload: AgentEventPayloadMap[T]) => void,
  toolName?: string,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    return subscribeAgentEvent(type, payload => {
      if (toolName !== undefined) {
        const p = payload as { toolName: string }
        if (p.toolName !== toolName) return
      }
      handlerRef.current(payload)
    })
  }, [type, toolName])
}
