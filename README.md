# react-agent-tool

[![CI](https://github.com/littleplato/react-agent-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/littleplato/react-agent-tool/actions/workflows/ci.yml)
[![Release](https://github.com/littleplato/react-agent-tool/actions/workflows/release.yml/badge.svg)](https://github.com/littleplato/react-agent-tool/actions/workflows/release.yml)

React hooks for exposing your app's functionality as callable tools to AI agents, built on the [WebMCP W3C spec](https://github.com/webmachinelearning/webmcp).

## Install

```sh
npm install react-agent-tool
pnpm add react-agent-tool
yarn add react-agent-tool
bun add react-agent-tool
```

## Testing in the browser

1. Download [Chrome Beta](https://www.google.com/chrome/beta/) (v146+)
2. Enable the WebMCP flag: `chrome://flags/#enable-webmcp-testing`
3. Install the [WebMCP Model Context Tool Inspector](https://chromewebstore.google.com/detail/webmcp-model-context-tool/gbpdfapgefenggkahomfgkhfehlcenpd) extension

The inspector lets you see registered tools and call them directly from the browser.

---

## Setup

Call `installPolyfill()` once at your app root before rendering. It installs `navigator.modelContext` if the browser doesn't support it natively yet.

```ts
import { installPolyfill } from 'react-agent-tool'

installPolyfill()
```

---

## `useAgentTool`

Registers a callable tool when the component mounts, unregisters on unmount.

```tsx
import { useAgentTool } from 'react-agent-tool'

function FlightSearch() {
  const { state } = useAgentTool({
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
    execute: async ({ origin, destination }) => {
      return await api.flights.search(origin, destination)
    },
  })

  return (
    <div>
      {state.isExecuting && <Spinner />}
      {state.error && <Error message={state.error.message} />}
      {state.lastResult && <FlightList data={state.lastResult} />}
    </div>
  )
}
```

**Options**

| Option | Type | Description |
|---|---|---|
| `name` | `string` | Tool identifier, must be unique |
| `description` | `string` | Shown to the agent to describe what this tool does |
| `inputSchema` | `JsonSchema` | JSON Schema for the tool's input |
| `execute` | `(input) => Promise<unknown>` | Called when the agent invokes the tool |
| `enabled` | `boolean` | Defaults to `true`. Set to `false` to temporarily unregister |

**Returns `{ state }`**

| Field | Type | Description |
|---|---|---|
| `state.isExecuting` | `boolean` | `true` while the agent is running this tool |
| `state.error` | `Error \| null` | Last execution error, if any |
| `state.lastResult` | `unknown` | Last successful result |

---

## `useAgentContext`

Exposes read-only React state for agents to observe. Use this when the value lives in React state or props, not a global singleton.

```tsx
import { useAgentContext } from 'react-agent-tool'

function Cart() {
  const [items, setItems] = useState<string[]>([])

  useAgentContext(
    'shopping_cart',
    'Current items in the shopping cart',
    () => ({ items, count: items.length }),
  )

  // ...
}
```

The value is snapshotted at the time the agent reads it, so it always reflects current state, even if the user made changes between agent actions.

---

## `useAgentEvent`

Lets any component react to agent activity without being coupled to the tool component.

```tsx
import { useAgentEvent } from 'react-agent-tool'

// Global indicator, fires for any tool
function AgentBanner() {
  const [active, setActive] = useState(false)
  useAgentEvent('tool:executing', () => setActive(true))
  useAgentEvent('tool:done', () => setActive(false))
  useAgentEvent('tool:error', () => setActive(false))
  return active ? <div>Agent is working…</div> : null
}

// Scoped to a specific tool
function FlightSearchIndicator() {
  const [searching, setSearching] = useState(false)
  useAgentEvent('tool:executing', () => setSearching(true), 'search_flights')
  useAgentEvent('tool:done', () => setSearching(false), 'search_flights')
  return searching ? <Spinner /> : null
}
```

**Events**

| Event | Payload |
|---|---|
| `tool:executing` | `{ toolName: string }` |
| `tool:done` | `{ toolName: string, result: unknown }` |
| `tool:error` | `{ toolName: string, error: Error }` |

---

## TypeScript

Input schemas are inferred. `execute` receives a fully typed argument:

```ts
useAgentTool({
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string' },
    },
    required: ['city'],
  },
  execute: async ({ city }) => { /* city: string */ },
})
```

## How it works

`react-agent-tool` is a thin wrapper around the [WebMCP W3C spec](https://github.com/webmachinelearning/webmcp) (`navigator.modelContext`). Hooks talk directly to the browser API. No intermediary server, no WebSocket, no SDK to update.

When a browser natively supports `navigator.modelContext` (Chrome v146+), `installPolyfill()` is a no-op and the library adds zero overhead. When native support isn't available, the polyfill installs a compatible implementation so your code works unchanged today and requires no migration when native support lands everywhere.

## Troubleshooting

**Invalid hook call (pnpm + Vite):** add `resolve: { dedupe: ['react', 'react-dom'] }` to your `vite.config.ts`.

## License

MIT
