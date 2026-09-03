import { afterEach, describe, expect, it } from 'vitest'
import {
  findOwnReport,
  forgetOwnReport,
  loadOwnReports,
  rememberOwnReport,
} from '../src/composables/ownReports'

const NOW = new Date('2026-09-03T15:00:00Z')

function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString()
}

afterEach(() => localStorage.clear())

describe('own reports store', () => {
  it('remembers and finds an own report', () => {
    rememberOwnReport({ id: 7, fairteilerId: 810, createdAt: minutesAgo(1) }, NOW)
    expect(loadOwnReports(NOW)).toHaveLength(1)
    expect(findOwnReport(810, minutesAgo(1), NOW)?.id).toBe(7)
    expect(findOwnReport(1220, minutesAgo(1), NOW)).toBeUndefined()
    expect(findOwnReport(810, minutesAgo(2), NOW)).toBeUndefined()
  })

  it('prunes entries older than the 15-minute undo window', () => {
    rememberOwnReport({ id: 1, fairteilerId: 810, createdAt: minutesAgo(20) }, NOW)
    rememberOwnReport({ id: 2, fairteilerId: 810, createdAt: minutesAgo(14) }, NOW)
    expect(loadOwnReports(NOW).map((e) => e.id)).toEqual([2])
    // 16 minutes later even that one is gone
    const later = new Date(NOW.getTime() + 16 * 60_000)
    expect(loadOwnReports(later)).toEqual([])
  })

  it('caps the stored list at 20 entries', () => {
    for (let i = 1; i <= 25; i += 1) {
      rememberOwnReport({ id: i, fairteilerId: 810, createdAt: minutesAgo(1) }, NOW)
    }
    const entries = loadOwnReports(NOW)
    expect(entries).toHaveLength(20)
    expect(entries[0]!.id).toBe(6) // oldest dropped
    expect(entries[19]!.id).toBe(25)
  })

  it('forgets a report after undo', () => {
    rememberOwnReport({ id: 7, fairteilerId: 810, createdAt: minutesAgo(1) }, NOW)
    forgetOwnReport(7, NOW)
    expect(loadOwnReports(NOW)).toEqual([])
  })

  it('survives corrupt storage', () => {
    localStorage.setItem('fairteiler-own-reports', '{broken')
    expect(loadOwnReports(NOW)).toEqual([])
    localStorage.setItem('fairteiler-own-reports', JSON.stringify([{ nope: true }]))
    expect(loadOwnReports(NOW)).toEqual([])
  })
})
