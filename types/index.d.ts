// The values the karen plugin keeps in $.state. Plain data, so they survive a hot reload.
export type KarenMode = boolean

declare module 'claude-code' {
  interface PluginState {
    karen: { on: KarenMode }
  }
}
