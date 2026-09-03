import { describe, expect, it } from 'vitest'
import { sortFairteiler } from '../src/lib/sort'
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
