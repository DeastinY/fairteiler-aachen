import { describe, expect, it } from 'vitest'
import { sortByDistance, sortByLastReported, sortFairteiler } from '../src/lib/sort'
import { makeFairteiler } from './fixtures'

describe('sortFairteiler', () => {
  it('puts etwas_da first, then sorts by 7-day activity', () => {
    const quietWithFood = makeFairteiler({
      id: 1,
      name: 'Ruhig, aber voll',
      status: { state: 'etwas_da', lastReportAt: '2026-09-03T10:00:00+00:00', tags: [] },
      activity7d: [0, 0, 0, 0, 0, 0, 1],
    })
    const busyEmpty = makeFairteiler({
      id: 2,
      name: 'Aktiv, aber leer',
      status: { state: 'leer', lastReportAt: '2026-09-03T09:00:00+00:00', tags: [] },
      activity7d: [5, 5, 5, 5, 5, 5, 5],
    })
    const busyWithFood = makeFairteiler({
      id: 3,
      name: 'Aktiv und voll',
      status: { state: 'etwas_da', lastReportAt: '2026-09-03T08:00:00+00:00', tags: [] },
      activity7d: [2, 2, 2, 2, 2, 2, 2],
    })
    const noReport = makeFairteiler({ id: 4, name: 'Ohne Meldung' })

    const sorted = sortFairteiler([noReport, busyEmpty, quietWithFood, busyWithFood])

    expect(sorted.map((f) => f.id)).toEqual([3, 1, 2, 4])
  })

  it('sortByDistance orders nearest first', () => {
    const here = { lat: 50.76, lon: 6.1 }
    const items = [
      makeFairteiler({ id: 1, name: 'Fern', lat: 50.9, lon: 6.3 }),
      makeFairteiler({ id: 2, name: 'Nah', lat: 50.761, lon: 6.099 }),
      makeFairteiler({ id: 3, name: 'Mittel', lat: 50.78, lon: 6.08 }),
    ]
    expect(sortByDistance(items, here).map((f) => f.id)).toEqual([2, 3, 1])
    expect(items.map((f) => f.id)).toEqual([1, 2, 3]) // no mutation
  })

  it('sortByLastReported orders newest first, nulls last', () => {
    const at = (minAgo: number) => new Date(Date.now() - minAgo * 60_000).toISOString()
    const items = [
      makeFairteiler({ id: 1, status: { state: 'keine_meldung', lastReportAt: null, tags: [] } }),
      makeFairteiler({ id: 2, status: { state: 'etwas_da', lastReportAt: at(120), tags: [] } }),
      makeFairteiler({ id: 3, status: { state: 'leer', lastReportAt: at(5), tags: [] } }),
      makeFairteiler({ id: 4, status: { state: 'keine_meldung', lastReportAt: null, tags: [] } }),
      makeFairteiler({ id: 5, status: { state: 'etwas_da', lastReportAt: at(30), tags: [] } }),
    ]
    items.push(
      makeFairteiler({ id: 6, status: { state: 'leer', lastReportAt: 'kaputt', tags: [] } }),
    )
    const sorted = sortByLastReported(items).map((f) => f.id)
    expect(sorted.slice(0, 3)).toEqual([3, 5, 2])
    // null and unparseable timestamps both go last
    expect(sorted.slice(3).sort()).toEqual([1, 4, 6])
    expect(items.map((f) => f.id)).toEqual([1, 2, 3, 4, 5, 6]) // no mutation
  })

  it('does not mutate the input array', () => {
    const items = [
      makeFairteiler({ id: 1 }),
      makeFairteiler({
        id: 2,
        status: { state: 'etwas_da', lastReportAt: '2026-09-03T10:00:00+00:00', tags: [] },
      }),
    ]
    sortFairteiler(items)
    expect(items.map((f) => f.id)).toEqual([1, 2])
  })
})
