const STORAGE_KEY = 'fairteiler-device-id'

let inMemoryId: string | null = null

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // fall through to the plain fallback below
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/**
 * Stable per-browser id used as X-Device-Id for the report rate limit.
 * Falls back to an in-memory id when localStorage is unavailable.
 */
export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    const fresh = randomId()
    localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  } catch {
    if (!inMemoryId) inMemoryId = randomId()
    return inMemoryId
  }
}
