export type JsonSchemaTypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'

export interface JsonSchema {
  type?: JsonSchemaTypeName | JsonSchemaTypeName[]
  properties?: Record<string, JsonSchema>
  required?: readonly string[]
  items?: JsonSchema
  description?: string
  enum?: readonly unknown[]
  additionalProperties?: boolean | JsonSchema
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// InferInput — JSON Schema → TypeScript type inference
// ---------------------------------------------------------------------------

type PrimitiveTypeMap = {
  string: string
  number: number
  integer: number
  boolean: boolean
  null: null
}

// Collapses intersection types into a single merged object type,
// preserving optionality — required for toEqualTypeOf to see equality.
type Prettify<T> = { [K in keyof T]: T[K] }

type RequiredProps<P extends Record<string, JsonSchema>, R extends readonly string[]> = {
  [K in keyof P as K extends R[number] ? K : never]: InferInput<P[K]>
}

type OptionalProps<P extends Record<string, JsonSchema>, R extends readonly string[]> = {
  [K in keyof P as K extends R[number] ? never : K]?: InferInput<P[K]>
}

export type InferInput<T extends JsonSchema> = T extends {
  type: 'object'
  properties: infer P extends Record<string, JsonSchema>
  required: infer R extends readonly string[]
}
  ? Prettify<RequiredProps<P, R> & OptionalProps<P, R>>
  : T extends {
        type: 'object'
        properties: infer P extends Record<string, JsonSchema>
      }
    ? Prettify<{ [K in keyof P]?: InferInput<P[K]> }>
    : T extends { type: 'object' }
      ? Record<string, unknown>
      : T extends { type: 'array'; items: infer I extends JsonSchema }
        ? InferInput<I>[]
        : T extends { type: 'array' }
          ? unknown[]
          : T extends { type: infer U extends keyof PrimitiveTypeMap }
            ? PrimitiveTypeMap[U]
            : unknown

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export interface ToolDefinition<T extends JsonSchema = JsonSchema> {
  name: string
  description: string
  inputSchema: T
  execute: (input: InferInput<T>) => Promise<unknown>
  readOnlyHint?: boolean
}

// ---------------------------------------------------------------------------
// navigator.modelContext surface (W3C WebMCP spec)
// ---------------------------------------------------------------------------

export interface ModelContextAPI {
  registerTool(definition: ToolDefinition): (() => void) | { unregister(): void } | void
  getTools(): readonly ToolDefinition[]
}

// ---------------------------------------------------------------------------
// Hook state
// ---------------------------------------------------------------------------

export interface AgentToolState<TResult = unknown> {
  isExecuting: boolean
  error: Error | null
  lastResult: TResult | null
}

// ---------------------------------------------------------------------------
// Event bus
// ---------------------------------------------------------------------------

export type AgentEventType = 'tool:executing' | 'tool:done' | 'tool:error'

export interface AgentEventPayloadMap {
  'tool:executing': { toolName: string }
  'tool:done': { toolName: string; result: unknown }
  'tool:error': { toolName: string; error: Error }
}
