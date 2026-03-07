import { useAgentTool } from '../../../src/hooks/useAgentTool'
import { emitAgentEvent } from '../../../src/events'
import { ToolState } from './ToolState'

const FAILING_SCHEMA = { type: 'object' as const }

export const FailingTool = () => {
  const { state } = useAgentTool({
    name: 'failing_tool',
    description: 'Always throws — demonstrates tool:error',
    inputSchema: FAILING_SCHEMA,
    execute: async () => { throw new Error('Something went wrong') },
  })

  const onSimulate = () => {
    const err = new Error('Something went wrong')
    emitAgentEvent('tool:executing', { toolName: 'failing_tool' })
    Promise.reject(err)
      .catch(() => emitAgentEvent('tool:error', { toolName: 'failing_tool', error: err }))
  }

  return <ToolState name="failing_tool" state={state} onSimulate={onSimulate} />
}
