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
    const result = applyFilter(ITEMS, { etwasDa: true, aroundTheClock: true, cooled: true })
    expect(result.map((f) => f.id)).toEqual([3])
  })
})
