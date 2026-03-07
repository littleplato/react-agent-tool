import { useState } from 'react'
import { useAgentEvent } from '../../../src/hooks/useAgentEvent'

export const AgentBanner = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  useAgentEvent('tool:executing', ({ toolName }) => setActiveTool(toolName))
  useAgentEvent('tool:done', () => setActiveTool(null))
  useAgentEvent('tool:error', () => setActiveTool(null))

  if (!activeTool) return null
  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white py-2 px-4 text-center z-50">
      Agent is executing <strong>{activeTool}</strong>…
    </div>
  )
}
