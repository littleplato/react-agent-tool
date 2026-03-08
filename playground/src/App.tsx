import { useState } from 'react'
import { AgentBanner } from './components/AgentBanner'
import { SearchFlightsTool } from './components/SearchFlightsTool'
import { GetWeatherTool } from './components/GetWeatherTool'
import { FailingTool } from './components/FailingTool'
import { EventLog } from './components/EventLog'
import { ShoppingCart } from './components/ShoppingCart'

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
    <div className="font-mono p-6 max-w-3xl mx-auto">
      <AgentBanner />
      <h2 className="mt-0 mb-6 text-xl font-bold">react-agent-tool Playground</h2>

      <section className="mb-6">
        <h3 className="mb-2 font-semibold">Mount / Unmount Tools</h3>
        <p className="mb-3 text-gray-500 text-sm">
          Mounting registers the tool. Unmounting unregisters it. Watch the event log.
        </p>
        <div className="flex gap-2 flex-wrap mb-4">
          {TOOLS.map(({ id }) => (
            <button
              key={id}
              className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
              onClick={() => toggle(id)}
            >
              {mounted[id] ? `unmount ${id}` : `mount ${id}`}
            </button>
          ))}
        </div>

        {TOOLS.map(({ id, Component }) =>
          mounted[id] ? <Component key={id} /> : null
        )}
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-semibold">useAgentEvent</h3>
        <p className="mb-2 text-gray-500 text-sm">
          The blue banner at the top uses <code>useAgentEvent</code> with no filter — fires for any tool.
          The dot next to each tool name uses it with a <code>toolName</code> filter — scoped to that tool only.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-semibold">useAgentContext</h3>
        <p className="mb-3 text-gray-500 text-sm">
          Cart state lives only in React — no global singleton. Tick items, then simulate
          an agent read to see the snapshot taken at call time.
        </p>
        <ShoppingCart />
      </section>

      <EventLog />
    </div>
  )
}
