import { useEffect, useRef, useState } from 'react'
import { subscribeAgentEvent } from '../../src/events'
import { getTools } from '../../src/registry'
import { useAgentTool } from '../../src/hooks/useAgentTool'
import { useAgentContext } from '../../src/hooks/useAgentContext'

// ---------------------------------------------------------------------------
// Schemas — defined outside components so references are stable
// ---------------------------------------------------------------------------

const SEARCH_FLIGHTS_SCHEMA = {
  type: 'object' as const,
  properties: {
    origin: { type: 'string' as const },
    destination: { type: 'string' as const },
  },
  required: ['origin', 'destination'] as const,
}

const GET_WEATHER_SCHEMA = {
  type: 'object' as const,
  properties: { city: { type: 'string' as const } },
  required: ['city'] as const,
}

const FAILING_SCHEMA = { type: 'object' as const }

// ---------------------------------------------------------------------------
// Tool components — each mounts/unmounts independently
// ---------------------------------------------------------------------------

function SearchFlightsTool() {
  const { state } = useAgentTool({
    name: 'search_flights',
    description: 'Search available flights by origin and destination',
    inputSchema: SEARCH_FLIGHTS_SCHEMA,
    execute: async input => {
      const { origin, destination } = input
      await new Promise(r => setTimeout(r, 600))
      return { flights: [`${origin}→${destination} 09:00`, `${origin}→${destination} 14:30`] }
    },
  })
  return <ToolState name="search_flights" state={state} fakeInput={{ origin: 'SIN', destination: 'NRT' }} />
}

function GetWeatherTool() {
  const { state } = useAgentTool({
    name: 'get_weather',
    description: 'Get current weather for a city',
    inputSchema: GET_WEATHER_SCHEMA,
    execute: async input => {
      const { city } = input
      await new Promise(r => setTimeout(r, 300))
      return { city, temp: '22°C', condition: 'Sunny' }
    },
  })
  return <ToolState name="get_weather" state={state} fakeInput={{ city: 'Singapore' }} />
}

function FailingTool() {
  const { state } = useAgentTool({
    name: 'failing_tool',
    description: 'Always throws — demonstrates tool:error',
    inputSchema: FAILING_SCHEMA,
    execute: async () => { throw new Error('Something went wrong') },
  })
  return <ToolState name="failing_tool" state={state} fakeInput={{}} />
}

// ---------------------------------------------------------------------------
// Shared state display + simulate button
// ---------------------------------------------------------------------------

interface ToolStateProps {
  name: string
  state: { isExecuting: boolean; error: Error | null; lastResult: unknown }
  fakeInput: Record<string, unknown>
}

function ToolState({ name, state, fakeInput }: ToolStateProps) {
  function simulate() {
    getTools()
      .find(t => t.name === name)
      ?.execute(fakeInput)
      .catch(() => {})
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{name}</strong>
        <button onClick={simulate} disabled={state.isExecuting}>
          {state.isExecuting ? 'executing…' : '▶ simulate agent call'}
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.9em' }}>
        <div>isExecuting: <code>{String(state.isExecuting)}</code></div>
        <div>lastResult: <code>{JSON.stringify(state.lastResult)}</code></div>
        {state.error && <div style={{ color: '#dc2626' }}>error: <code>{state.error.message}</code></div>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

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

function EventLog() {
  const [log, setLog] = useState<LogEntry[]>([])
  const counter = useRef(0)

  useEffect(() => {
    const add = (type: LogEntry['type'], payload: unknown) =>
      setLog(prev => [
        ...prev,
        { id: counter.current++, time: new Date().toLocaleTimeString(), type, payload: JSON.stringify(payload) },
      ])

    const unsubs = [
      subscribeAgentEvent('tool:executing', p => add('tool:executing', p)),
      subscribeAgentEvent('tool:done', p => add('tool:done', p)),
      subscribeAgentEvent('tool:error', p => add('tool:error', p)),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [])

  return (
    <section>
      <h3 style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span>Event Log</span>
        <button onClick={() => setLog([])}>Clear</button>
      </h3>
      <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 12, minHeight: 120, maxHeight: 320, overflowY: 'auto' }}>
        {log.length === 0
          ? <span style={{ color: '#999' }}>No events yet.</span>
          : log.map(entry => (
              <div key={entry.id} style={{ marginBottom: 6 }}>
                <span style={{ color: '#999' }}>[{entry.time}]</span>{' '}
                <span style={{ color: EVENT_COLORS[entry.type], fontWeight: 'bold' }}>{entry.type}</span>
                {' '}— {entry.payload}
              </div>
            ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// useAgentContext demo — shopping cart
// ---------------------------------------------------------------------------

const PRODUCTS = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones']

function ShoppingCart() {
  const [items, setItems] = useState<string[]>([])
  const [lastSnapshot, setLastSnapshot] = useState<unknown>(null)

  // Cart state lives only in React — there is no global singleton to read from.
  // useAgentContext exposes it so agents can read it on demand.
  useAgentContext(
    'shopping_cart',
    'Current items in the shopping cart and their count',
    () => ({ items, count: items.length }),
  )

  function toggle(product: string) {
    setItems(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product],
    )
  }

  function simulate() {
    getTools()
      .find(t => t.name === 'shopping_cart')
      ?.execute({})
      .then(result => setLastSnapshot(result))
      .catch(() => {})
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <strong>Cart</strong> — tick items to add them, then let the agent read it:
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        {PRODUCTS.map(product => (
          <label key={product} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={items.includes(product)}
              onChange={() => toggle(product)}
            />
            {product}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={simulate}>▶ simulate agent read</button>
        <span style={{ color: '#666', fontSize: '0.9em' }}>
          {items.length === 0 ? 'cart is empty' : `${items.length} item(s) in cart`}
        </span>
      </div>

      {lastSnapshot !== null && (
        <div style={{ marginTop: 12, fontSize: '0.9em' }}>
          Agent saw: <code>{JSON.stringify(lastSnapshot)}</code>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const TOOLS = [
  { id: 'search_flights', Component: SearchFlightsTool },
  { id: 'get_weather', Component: GetWeatherTool },
  { id: 'failing_tool', Component: FailingTool },
]

export default function App() {
  const [mounted, setMounted] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setMounted(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: 24, maxWidth: 760 }}>
      <h2 style={{ marginTop: 0 }}>useAgentTool Playground</h2>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Mount / Unmount Tools</h3>
        <p style={{ margin: '0 0 12px', color: '#666', fontSize: '0.9em' }}>
          Mounting registers the tool. Unmounting unregisters it. Watch the event log.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TOOLS.map(({ id }) => (
            <button key={id} onClick={() => toggle(id)}>
              {mounted[id] ? `unmount ${id}` : `mount ${id}`}
            </button>
          ))}
        </div>

        {TOOLS.map(({ id, Component }) =>
          mounted[id] ? <Component key={id} /> : null
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>useAgentContext</h3>
        <p style={{ margin: '0 0 12px', color: '#666', fontSize: '0.9em' }}>
          Cart state lives only in React — no global singleton. Tick items, then simulate
          an agent read to see the snapshot taken at call time.
        </p>
        <ShoppingCart />
      </section>

      <EventLog />
    </div>
  )
}
