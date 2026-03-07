import { useAgentTool } from '../../../src/hooks/useAgentTool'
import { emitAgentEvent } from '../../../src/events'
import { ToolState } from './ToolState'

const SEARCH_FLIGHTS_SCHEMA = {
  type: 'object' as const,
  properties: {
    origin: { type: 'string' as const },
    destination: { type: 'string' as const },
  },
  required: ['origin', 'destination'] as const,
}

async function searchFlights(origin: string, destination: string) {
  await new Promise(r => setTimeout(r, 600))
  return { flights: [`${origin}→${destination} 09:00`, `${origin}→${destination} 14:30`] }
}

export function SearchFlightsTool() {
  const { state } = useAgentTool({
    name: 'search_flights',
    description: 'Search available flights by origin and destination',
    inputSchema: SEARCH_FLIGHTS_SCHEMA,
    execute: async ({ origin, destination }) => searchFlights(origin, destination),
  })

  function onSimulate() {
    emitAgentEvent('tool:executing', { toolName: 'search_flights' })
    searchFlights('SIN', 'NRT')
      .then(result => emitAgentEvent('tool:done', { toolName: 'search_flights', result }))
      .catch(error => {
        const err = error instanceof Error ? error : new Error(String(error))
        emitAgentEvent('tool:error', { toolName: 'search_flights', error: err })
      })
  }

  return <ToolState name="search_flights" state={state} onSimulate={onSimulate} />
}
