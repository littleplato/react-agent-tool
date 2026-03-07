import { useEffect, useRef, useState } from 'react'
import { subscribeAgentEvent } from '../../src/events'
import { registerTool, getTools } from '../../src/registry'
import type { ToolDefinition } from '../../src/types'

interface LogEntry {
  id: number
  time: string
  type: 'tool:executing' | 'tool:done' | 'tool:error'
  payload: string
}

const EVENT_COLORS = {
  'tool:executing': '#2563eb',
  'tool:done': '#16a34a',
  'tool:error': '#dc2626',
}

// Fake tools available to register
const DEMO_TOOLS: ToolDefinition[] = [
  {
    name: 'search_flights',
    description: 'Search available flights by origin and destination',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'IATA airport code' },
        destination: { type: 'string', description: 'IATA airport code' },
      },
      required: ['origin', 'destination'],
    },
    execute: async (input) => {
      const { origin, destination } = input as { origin: string; destination: string }
      await new Promise(r => setTimeout(r, 400))
      return { flights: [`${origin}→${destination} 09:00`, `${origin}→${destination} 14:30`] }
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather for a city',
    inputSchema: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    },
    execute: async (input) => {
      const { city } = input as { city: string }
      await new Promise(r => setTimeout(r, 200))
      return { city, temp: '22°C', condition: 'Sunny' }
    },
  },
  {
    name: 'failing_tool',
    description: 'Always throws — demonstrates tool:error',
    inputSchema: { type: 'object' },
    execute: async () => {
      throw new Error('Something went wrong')
    },
  },
]

export default function App() {
  const [registeredNames, setRegisteredNames] = useState<string[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const counter = useRef(0)

  function addEntry(type: LogEntry['type'], payload: unknown) {
    setLog(prev => [
      ...prev,
      {
        id: counter.current++,
        time: new Date().toLocaleTimeString(),
        type,
        payload: JSON.stringify(payload, null, 0),
      },
    ])
  }

  useEffect(() => {
    const unsubs = [
      subscribeAgentEvent('tool:executing', p => addEntry('tool:executing', p)),
      subscribeAgentEvent('tool:done', p => addEntry('tool:done', p)),
      subscribeAgentEvent('tool:error', p => addEntry('tool:error', p)),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [])

  function handleRegister(tool: ToolDefinition) {
    registerTool(tool)
    setRegisteredNames(getTools().map(t => t.name))
  }

  function handleExecute(name: string) {
    const tool = getTools().find(t => t.name === name)
    if (!tool) return
    const fakeInputs: Record<string, unknown> = {
      search_flights: { origin: 'SIN', destination: 'NRT' },
      get_weather: { city: 'Singapore' },
      failing_tool: {},
    }
    tool.execute(fakeInputs[name] ?? {}).catch(() => {})
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore -- globals.d.ts is not visible to the playground's isolated tsconfig
  const polyfillInstalled = !!navigator.modelContext

  return (
    <div style={{ fontFamily: 'monospace', padding: 24, maxWidth: 760 }}>
      <h2 style={{ marginTop: 0 }}>Registry + Polyfill Playground</h2>

      {/* Polyfill status */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Polyfill</h3>
        <div>
          navigator.modelContext:{' '}
          <strong style={{ color: polyfillInstalled ? '#16a34a' : '#dc2626' }}>
            {polyfillInstalled ? 'installed ✓' : 'not installed'}
          </strong>
        </div>
      </section>

      {/* Register tools */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Register a Tool</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DEMO_TOOLS.map(tool => (
            <button key={tool.name} onClick={() => handleRegister(tool)}>
              + {tool.name}
            </button>
          ))}
        </div>
      </section>

      {/* Registered tools */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>
          Registered Tools ({registeredNames.length})
        </h3>
        {registeredNames.length === 0 ? (
          <span style={{ color: '#999' }}>None yet — register one above.</span>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {registeredNames.map(name => (
              <button key={name} onClick={() => handleExecute(name)}>
                ▶ execute {name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Event log */}
      <section>
        <h3 style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Event Log</span>
          <button onClick={() => setLog([])}>Clear</button>
        </h3>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 12,
            minHeight: 160,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {log.length === 0 ? (
            <span style={{ color: '#999' }}>No events yet.</span>
          ) : (
            log.map(entry => (
              <div key={entry.id} style={{ marginBottom: 6 }}>
                <span style={{ color: '#999' }}>[{entry.time}]</span>{' '}
                <span
                  style={{
                    color: EVENT_COLORS[entry.type],
                    fontWeight: 'bold',
                  }}
                >
                  {entry.type}
                </span>{' '}
                — {entry.payload}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
