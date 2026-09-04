import { describe, expect, it } from 'vitest'
import { applyFilter, emptyFilter } from '../src/lib/filters'
import { makeFairteiler } from './fixtures'

const ITEMS = [
  makeFairteiler({
    id: 1,
    name: 'Voll und offen',
    aroundTheClock: true,
    cooled: false,
    status: { state: 'etwas_da', lastReportAt: '2026-09-03T10:00:00+00:00', tags: [] },
  }),
  makeFairteiler({
    id: 2,
    name: 'Gekühlt, leer',
    aroundTheClock: false,
    cooled: true,
    status: { state: 'leer', lastReportAt: '2026-09-03T09:00:00+00:00', tags: [] },
  }),
  makeFairteiler({
    id: 3,
    name: 'Alles',
    aroundTheClock: true,
    cooled: true,
    status: { state: 'etwas_da', lastReportAt: '2026-09-03T08:00:00+00:00', tags: [] },
  }),
  makeFairteiler({ id: 4, name: 'Nichts davon' }),
]

describe('applyFilter', () => {
  it('returns everything with an empty filter', () => {
    expect(applyFilter(ITEMS, emptyFilter())).toHaveLength(4)
  })

  it('filters by status etwas_da', () => {
    const result = applyFilter(ITEMS, { ...emptyFilter(), etwasDa: true })
    expect(result.map((f) => f.id)).toEqual([1, 3])
  })

  it('filters by aroundTheClock and cooled', () => {
    expect(
      applyFilter(ITEMS, { ...emptyFilter(), aroundTheClock: true }).map((f) => f.id),
    ).toEqual([1, 3])
    expect(applyFilter(ITEMS, { ...emptyFilter(), cooled: true }).map((f) => f.id)).toEqual([
      2, 3,
    ])
  })

  it('combines active chips with AND', () => {
    const result = applyFilter(ITEMS, {
      ...emptyFilter(),
      etwasDa: true,
      aroundTheClock: true,
      cooled: true,
    })
    expect(result.map((f) => f.id)).toEqual([3])
  })

  it('"Jetzt offen" matches open or 24/7 places and EXCLUDES unknown hours', () => {
    const items = [
      makeFairteiler({ id: 1, name: 'Offen', openNow: true }),
      makeFairteiler({ id: 2, name: 'Rund um die Uhr', aroundTheClock: true, openNow: true }),
      makeFairteiler({ id: 3, name: 'Geschlossen', openNow: false }),
      // honest semantics: unknown (null) never counts as "open now"
      makeFairteiler({ id: 4, name: 'Unbekannt', openNow: null }),
    ]
    const result = applyFilter(items, { ...emptyFilter(), openNow: true })
    expect(result.map((f) => f.id)).toEqual([1, 2])
  })

  it('the accessibility filter keeps only known step-free places', () => {
    const items = [
      makeFairteiler({ id: 1, accessible: true }),
      makeFairteiler({ id: 2, accessible: false }),
      makeFairteiler({ id: 3, accessible: null }), // unknown stays out
    ]
    const filter = { ...emptyFilter(), accessible: true }
    expect(applyFilter(items, filter).map((f) => f.id)).toEqual([1])
    expect(applyFilter(items, emptyFilter())).toHaveLength(3)
  })
})
