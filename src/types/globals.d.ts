// Ambient augmentation — no imports/exports so declarations are global by default
interface Navigator {
  readonly modelContext?: import('./index').ModelContextAPI
}
