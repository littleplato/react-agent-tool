export interface ToolStateProps {
  name: string
  state: { isExecuting: boolean; error: Error | null; lastResult: unknown }
  onSimulate: () => void
}

export const ToolState = ({ name, state, onSimulate }: ToolStateProps) => (
  <div className="border border-gray-200 rounded p-3 mb-2">
    <div className="flex justify-between items-center">
      <span>
        <span
          className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${state.isExecuting ? 'bg-green-600' : 'bg-gray-300'}`}
        />
        <strong>{name}</strong>
      </span>
      <button
        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        onClick={onSimulate}
        disabled={state.isExecuting}
      >
        {state.isExecuting ? 'executing…' : '▶ simulate agent call'}
      </button>
    </div>
    <div className="mt-2 text-sm">
      <div>
        isExecuting: <code>{String(state.isExecuting)}</code>
      </div>
      <div>
        lastResult: <code>{JSON.stringify(state.lastResult)}</code>
      </div>
      {state.error && (
        <div className="text-red-600">
          error: <code>{state.error.message}</code>
        </div>
      )}
    </div>
  </div>
)
