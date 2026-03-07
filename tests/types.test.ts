import { describe, it, expectTypeOf } from 'vitest'
import type { InferInput } from '../src/types'

describe('InferInput', () => {
  it('infers string primitive', () => {
    expectTypeOf<InferInput<{ type: 'string' }>>().toEqualTypeOf<string>()
  })

  it('infers number primitive', () => {
    expectTypeOf<InferInput<{ type: 'number' }>>().toEqualTypeOf<number>()
  })

  it('infers boolean primitive', () => {
    expectTypeOf<InferInput<{ type: 'boolean' }>>().toEqualTypeOf<boolean>()
  })

  it('infers object with all required fields', () => {
    type Schema = {
      type: 'object'
      properties: {
        origin: { type: 'string' }
        destination: { type: 'string' }
      }
      required: readonly ['origin', 'destination']
    }
    expectTypeOf<InferInput<Schema>>().toEqualTypeOf<{
      origin: string
      destination: string
    }>()
  })

  it('infers object with mixed required and optional fields', () => {
    type Schema = {
      type: 'object'
      properties: {
        name: { type: 'string' }
        age: { type: 'number' }
      }
      required: readonly ['name']
    }
    expectTypeOf<InferInput<Schema>>().toEqualTypeOf<{
      name: string
      age?: number
    }>()
  })

  it('infers array of primitives', () => {
    type Schema = {
      type: 'array'
      items: { type: 'string' }
    }
    expectTypeOf<InferInput<Schema>>().toEqualTypeOf<string[]>()
  })

  it('falls back to unknown for untyped schema', () => {
    expectTypeOf<InferInput<Record<string, never>>>().toEqualTypeOf<unknown>()
  })
})
