// Normalises the return value of navigator.modelContext.registerTool().
// Our polyfill returns () => void.
// The native Chrome API returns { unregister(): void }.
// Either way, React gets a plain cleanup function.
export function toCleanup(
  result: (() => void) | { unregister(): void } | void,
): (() => void) | undefined {
  if (typeof result === 'function') return result
  if (result != null && typeof (result as { unregister?: unknown }).unregister === 'function') {
    return () => (result as { unregister(): void }).unregister()
  }
  return undefined
}
