/**
 * API base handling for cross-origin deploys (frontend on GitHub Pages,
 * API elsewhere). VITE_API_BASE empty/unset keeps same-origin paths, which
 * serves both the dev proxy and same-origin production setups.
 */

/** Pure join: prefixes `path` (must start with /) with a trimmed base. */
export function joinApiUrl(base: string | undefined, path: string): string {
  const trimmed = (base ?? '').replace(/\/+$/, '')
  return trimmed ? `${trimmed}${path}` : path
}

/** Resolves an /api/... path against the configured VITE_API_BASE. */
export function apiUrl(path: string): string {
  return joinApiUrl(import.meta.env.VITE_API_BASE, path)
}

/** True when `href` is a GET-cacheable fairteiler API URL for this deploy. */
export function isFairteilerApiUrl(
  href: string,
  base: string | undefined,
  pageOrigin: string,
): boolean {
  const prefix = joinApiUrl(base, '/api/fairteiler')
  const absolutePrefix = prefix.startsWith('http') ? prefix : `${pageOrigin}${prefix}`
  return href.startsWith(absolutePrefix)
}
