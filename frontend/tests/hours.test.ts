import { describe, expect, it } from 'vitest'
import { formatHours, formatRange, openHint, todayKey } from '../src/lib/hours'

describe('formatRange', () => {
  it('formats whole hours', () => {
    expect(formatRange([10, 18])).toBe('10–18 Uhr')
  })

  it('formats fractional hours as minutes', () => {
    expect(formatRange([10, 16.5])).toBe('10–16:30 Uhr')
    expect(formatRange([7.25, 9])).toBe('7:15–9 Uhr')
  })
})

describe('formatHours', () => {
  it('returns seven Mo–So rows with Geschlossen for missing days', () => {
    const rows = formatHours({ mo: [[10, 18]], sa: [[10, 16.5]] })
    expect(rows).toHaveLength(7)
    expect(rows.map((r) => r.label)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'])
    expect(rows[0]!.text).toBe('10–18 Uhr')
    expect(rows[1]!.text).toBe('Geschlossen')
    expect(rows[5]!.text).toBe('10–16:30 Uhr')
    expect(rows[6]!.text).toBe('Geschlossen')
  })

  it('joins multiple ranges of one day', () => {
    const rows = formatHours({ we: [[8, 12], [14, 18]] })
    expect(rows[2]!.text).toBe('8–12 Uhr und 14–18 Uhr')
  })
})

describe('todayKey', () => {
  it('maps JS weekdays to mo..su keys', () => {
    expect(todayKey(new Date('2026-09-07T12:00:00'))).toBe('mo') // Monday
    expect(todayKey(new Date('2026-09-05T12:00:00'))).toBe('sa') // Saturday
    expect(todayKey(new Date('2026-09-06T12:00:00'))).toBe('su') // Sunday
  })
})

describe('openHint', () => {
  it('shows Geschlossen when closed', () => {
    expect(openHint({ openNow: false, aroundTheClock: false })).toBe('Geschlossen')
  })

  it('shows Jetzt geöffnet only for places that are not 24/7', () => {
    expect(openHint({ openNow: true, aroundTheClock: false })).toBe('Jetzt geöffnet')
    expect(openHint({ openNow: true, aroundTheClock: true })).toBeNull()
  })

  it('shows nothing when unknown', () => {
    expect(openHint({ openNow: null, aroundTheClock: false })).toBeNull()
  })
})
