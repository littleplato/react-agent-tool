import { useEffect, useRef, useState } from 'react'
import { subscribeAgentEvent } from '../../../src/events'

interface LogEntry {
  id: number
  time: string
  type: 'tool:executing' | 'tool:done' | 'tool:error'
  payload: string
}

const EVENT_COLORS: Record<LogEntry['type'], string> = {
  'tool:executing': 'text-blue-600',
  'tool:done': 'text-green-600',
  'tool:error': 'text-red-600',
}

export function EventLog() {
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
      <h3 className="mb-2 flex justify-between items-center font-semibold">
        <span>Event Log</span>
        <button
          className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
          onClick={() => setLog([])}
        >
          Clear
        </button>
      </h3>
      <div className="border border-gray-300 rounded p-3 min-h-[120px] max-h-80 overflow-y-auto text-sm">
        {log.length === 0
          ? <span className="text-gray-400">No events yet.</span>
          : log.map(entry => (
              <div key={entry.id} className="mb-1.5">
                <span className="text-gray-400">[{entry.time}]</span>{' '}
                <span className={`font-bold ${EVENT_COLORS[entry.type]}`}>{entry.type}</span>
                {' '}— {entry.payload}
              </div>
            ))}
      </div>
    </section>
  )
}
