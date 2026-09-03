/**
 * Client-side memory of the reports THIS browser created, so they can be
 * undone within the backend's 15-minute window. Guarded localStorage.
 */

const STORAGE_KEY = 'fairteiler-own-reports'

export const UNDO_WINDOW_MINUTES = 15
const MAX_ENTRIES = 20

export interface OwnReport {
  id: number
  fairteilerId: number
  createdAt: string
}

function isFresh(entry: OwnReport, now: Date): boolean {
  const created = new Date(entry.createdAt).getTime()
  if (Number.isNaN(created)) return false
  return now.getTime() - created < UNDO_WINDOW_MINUTES * 60_000
}

function isValid(value: unknown): value is OwnReport {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record['id'] === 'number' &&
    typeof record['fairteilerId'] === 'number' &&
    typeof record['createdAt'] === 'string'
  )
}

function persist(entries: OwnReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // storage unavailable – undo simply won't survive a reload
  }
}

/** Own reports still inside the undo window (stale entries are pruned). */
export function loadOwnReports(now: Date = new Date()): OwnReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValid).filter((entry) => isFresh(entry, now))
  } catch {
    return []
  }
}

export function rememberOwnReport(entry: OwnReport, now: Date = new Date()): void {
  const entries = loadOwnReports(now).filter((e) => e.id !== entry.id)
  entries.push(entry)
  persist(entries.slice(-MAX_ENTRIES))
}

export function forgetOwnReport(id: number, now: Date = new Date()): void {
  persist(loadOwnReports(now).filter((entry) => entry.id !== id))
}

/** Detail report rows carry ids – an own report is recognized by its id. */
export function isOwnReport(reportId: number, now: Date = new Date()): boolean {
  return loadOwnReports(now).some((entry) => entry.id === reportId)
}
