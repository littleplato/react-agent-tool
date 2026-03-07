import { useEffect, useRef, useState } from 'react'
import { emitAgentEvent, subscribeAgentEvent } from '../../src/events'

interface LogEntry {
  id: number
  time: string
  type: 'tool:executing' | 'tool:done' | 'tool:error'
  payload: string
}

const COLORS = {
  'tool:executing': '#2563eb',
  'tool:done': '#16a34a',
  'tool:error': '#dc2626',
}

export default function App() {
  const [log, setLog] = useState<LogEntry[]>([])
  const counter = useRef(0)

  function addEntry(type: LogEntry['type'], payload: unknown) {
    setLog(prev => [
      ...prev,
      {
        id: counter.current++,
        time: new Date().toLocaleTimeString(),
        type,
        payload: JSON.stringify(payload),
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

  return (
    <div style={{ fontFamily: 'monospace', padding: 24, maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>Event Bus Playground</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() =>
            emitAgentEvent('tool:executing', { toolName: 'search_flights' })
          }
        >
          Emit tool:executing
        </button>
        <button
          onClick={() =>
            emitAgentEvent('tool:done', {
              toolName: 'search_flights',
              result: { flights: 3 },
            })
          }
        >
          Emit tool:done
        </button>
        <button
          onClick={() =>
            emitAgentEvent('tool:error', {
              toolName: 'search_flights',
              error: new Error('Seat unavailable'),
            })
          }
        >
          Emit tool:error
        </button>
        <button onClick={() => setLog([])}>Clear</button>
      </div>

      <div
        style={{
          marginTop: 16,
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: 12,
          minHeight: 200,
          maxHeight: 400,
          overflowY: 'auto',
        }}
      >
        {log.length === 0 ? (
          <span style={{ color: '#999' }}>No events yet — click a button above.</span>
        ) : (
          log.map(entry => (
            <div key={entry.id} style={{ marginBottom: 6 }}>
              <span style={{ color: '#999' }}>[{entry.time}]</span>{' '}
              <span style={{ color: COLORS[entry.type], fontWeight: 'bold' }}>
                {entry.type}
              </span>{' '}
              — {entry.payload}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
