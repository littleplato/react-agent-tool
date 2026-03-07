import { useAgentTool } from '../../../src/hooks/useAgentTool'
import { emitAgentEvent } from '../../../src/events'
import { ToolState } from './ToolState'

const GET_WEATHER_SCHEMA = {
  type: 'object' as const,
  properties: { city: { type: 'string' as const } },
  required: ['city'] as const,
}

async function getWeather(city: string) {
  await new Promise(r => setTimeout(r, 300))
  return { city, temp: '22°C', condition: 'Sunny' }
}

export function GetWeatherTool() {
  const { state } = useAgentTool({
    name: 'get_weather',
    description: 'Get current weather for a city',
    inputSchema: GET_WEATHER_SCHEMA,
    execute: async ({ city }) => getWeather(city),
  })

  function onSimulate() {
    emitAgentEvent('tool:executing', { toolName: 'get_weather' })
    getWeather('Singapore')
      .then(result => emitAgentEvent('tool:done', { toolName: 'get_weather', result }))
      .catch(error => {
        const err = error instanceof Error ? error : new Error(String(error))
        emitAgentEvent('tool:error', { toolName: 'get_weather', error: err })
      })
  }

  return <ToolState name="get_weather" state={state} onSimulate={onSimulate} />
}
