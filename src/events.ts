import type { AgentEventType, AgentEventPayloadMap } from './types'

const bus = new EventTarget()

export function emitAgentEvent<T extends AgentEventType>(
  type: T,
  payload: AgentEventPayloadMap[T],
): void {
  bus.dispatchEvent(new CustomEvent(type, { detail: payload }))
}

export function subscribeAgentEvent<T extends AgentEventType>(
  type: T,
  handler: (payload: AgentEventPayloadMap[T]) => void,
): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<AgentEventPayloadMap[T]>).detail)
  }
  bus.addEventListener(type, listener)
  return () => bus.removeEventListener(type, listener)
}
