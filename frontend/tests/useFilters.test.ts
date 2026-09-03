import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * useFilters restores from localStorage at module load, so each scenario
 * imports a fresh module instance.
 */
async function freshModule() {
  vi.resetModules()
  return await import('../src/composables/useFilters')
}

beforeEach(() => {
  localStorage.clear()
})

describe('useFilters', () => {
  it('starts empty without stored state', async () => {
    const { useFilters } = await freshModule()
    expect(useFilters()).toMatchObject({
      etwasDa: false,
      aroundTheClock: false,
      cooled: false,
      openNow: false,
    })
  })

  it('restores a stored filter, ignoring junk fields and non-boolean values', async () => {
    localStorage.setItem(
      'fairteiler-filter',
      JSON.stringify({ etwasDa: true, cooled: 'yes', openNow: true, bogus: true }),
    )
    const { useFilters } = await freshModule()
    const filter = useFilters()
    expect(filter.etwasDa).toBe(true)
    expect(filter.openNow).toBe(true)
    expect(filter.cooled).toBe(false) // only === true counts
    expect(filter.aroundTheClock).toBe(false)
  })

  it('survives corrupt or non-object storage', async () => {
    localStorage.setItem('fairteiler-filter', '{broken json')
    let mod = await freshModule()
    expect(mod.useFilters().etwasDa).toBe(false)

    localStorage.setItem('fairteiler-filter', '"just a string"')
    mod = await freshModule()
    expect(mod.useFilters().cooled).toBe(false)
  })

  it('persists every change through the watcher', async () => {
    const { useFilters } = await freshModule()
    const filter = useFilters()
    filter.cooled = true
    await nextTick()
    expect(JSON.parse(localStorage.getItem('fairteiler-filter')!)).toMatchObject({
      cooled: true,
    })

    filter.etwasDa = true
    await nextTick()
    expect(JSON.parse(localStorage.getItem('fairteiler-filter')!)).toMatchObject({
      cooled: true,
      etwasDa: true,
    })
  })

  it('resetFilters clears all chips and persists the empty state', async () => {
    const { useFilters, resetFilters } = await freshModule()
    const filter = useFilters()
    filter.etwasDa = true
    filter.openNow = true
    resetFilters()
    expect(filter.etwasDa).toBe(false)
    expect(filter.openNow).toBe(false)
    await nextTick()
    expect(JSON.parse(localStorage.getItem('fairteiler-filter')!)).toMatchObject({
      etwasDa: false,
      openNow: false,
    })
  })
})
