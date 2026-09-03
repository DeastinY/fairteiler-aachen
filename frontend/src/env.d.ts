/// <reference types="vite/client" />

/** App version from package.json, injected at build time via Vite `define`. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** Absolute origin of the API for cross-origin deploys; empty = same origin. */
  readonly VITE_API_BASE?: string
  /** Public base path of the frontend (e.g. /fairteiler-aachen/); default "/". */
  readonly VITE_BASE?: string
}
