import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from '../src/lib/relativeTime'

const NOW = new Date('2026-09-03T15:00:00+02:00')

function minus(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString()
}

describe('formatRelativeTime', () => {
  it('renders "gerade eben" for under a minute', () => {
    expect(formatRelativeTime(minus(0.5), NOW)).toBe('gerade eben')
  })

  it('renders minutes in German', () => {
    expect(formatRelativeTime(minus(18), NOW)).toBe('vor 18 Min')
    expect(formatRelativeTime(minus(59), NOW)).toBe('vor 59 Min')
  })

  it('renders hours in German', () => {
    expect(formatRelativeTime(minus(60), NOW)).toBe('vor 1 Std')
    expect(formatRelativeTime(minus(2 * 60 + 10), NOW)).toBe('vor 2 Std')
    expect(formatRelativeTime(minus(23 * 60), NOW)).toBe('vor 23 Std')
  })

  it('renders "gestern" for the previous calendar day beyond 24h', () => {
    // 15:00 today minus 25h -> 14:00 yesterday
    expect(formatRelativeTime(minus(25 * 60), NOW)).toBe('gestern')
  })

  it('renders days for older reports', () => {
    expect(formatRelativeTime(minus(3 * 24 * 60), NOW)).toBe('vor 3 Tagen')
  })

  it('handles missing timestamps', () => {
    expect(formatRelativeTime(null, NOW)).toBe('noch keine Meldung')
    expect(formatRelativeTime('kaputt', NOW)).toBe('noch keine Meldung')
  })
})
