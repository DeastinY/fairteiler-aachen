/** First-open welcome screen: shown once, never in the way of deep links. */

const STORAGE_KEY = 'fairteiler-welcome-done'

export function isWelcomeDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return true // no storage -> never nag on every load
  }
}

export function markWelcomeDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // storage unavailable
  }
}

/** QR-scan style entries go straight to their target, welcome waits. */
export function isDeepLinkEntry(path: string): boolean {
  return path.startsWith('/fairteiler/') || path.startsWith('/melden')
}

/** Pure decision: show only when not done yet and not a deep-link entry. */
export function shouldShowWelcome(entryPath: string, done: boolean): boolean {
  return !done && !isDeepLinkEntry(entryPath)
}
