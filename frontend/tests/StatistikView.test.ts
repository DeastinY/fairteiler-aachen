import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StatistikView from '../src/views/StatistikView.vue'
import { jsonResponse } from './fixtures'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: vi.fn() }) }
})

const fetchMock = vi.fn()

function makeUsage() {
  // 14 days, oldest first; last day (today) has distinctive values
  const days = []
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(2026, 8, 4 - i)) // ends 2026-09-04
    days.push({
      day: date.toISOString().slice(0, 10),
      listViews: i === 0 ? 40 : i === 13 ? 10 : 20,
      detailViews: 5,
      reports: i === 0 ? 8 : 4,
    })
  }
  return days
}

const STATS = {
  fairteilerTotal: 11,
  withFood: 4,
  reports7d: 23,
  pushSubscriptions: 17,
  usage14d: makeUsage(),
}

function mountStatistik() {
  return mount(StatistikView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('StatistikView', () => {
  it('renders the three number tiles from /api/stats', async () => {
    fetchMock.mockResolvedValue(jsonResponse(STATS))

    const wrapper = mountStatistik()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/stats', undefined)
    const tiles = wrapper.findAll('.tile')
    expect(tiles).toHaveLength(3)
    expect(tiles[0]!.text()).toContain('23')
    expect(tiles[0]!.text()).toContain('Meldungen (7 Tage)')
    expect(tiles[1]!.text()).toContain('17')
    expect(tiles[1]!.text()).toContain('Push-Abos')
    expect(tiles[2]!.text()).toContain('4')
    expect(tiles[2]!.text()).toContain('11')
    // fraction order is locked left-to-right even in RTL locales
    expect(tiles[2]!.find('bdi[dir="ltr"]').exists()).toBe(true)
    expect(tiles[2]!.text()).toContain('Fairteiler mit Essen')
  })

  it('renders two 14-day charts with proportional, today-emphasized bars', async () => {
    fetchMock.mockResolvedValue(jsonResponse(STATS))

    const wrapper = mountStatistik()
    await flushPromises()

    const views = wrapper.find('[data-test="views-chart"]')
    expect(views.text()).toContain('App-Aufrufe pro Tag')
    const viewBars = views.findAll('.bar')
    expect(viewBars).toHaveLength(14)

    // proportional: today (40) = max height 56, middle days (20) = half
    const px = (bar: (typeof viewBars)[number]) => Number.parseInt(bar.element.style.height)
    expect(px(viewBars[13]!)).toBe(56)
    expect(px(viewBars[5]!)).toBe(28)
    expect(px(viewBars[0]!)).toBe(14) // 10/40 * 56
    expect(viewBars[13]!.classes()).toContain('hi')
    expect(viewBars[0]!.classes()).not.toContain('hi')

    // today's value labeled directly
    expect(views.find('.value').text()).toBe('40')

    // only first, middle and last date labels are visible
    const labelTexts = views.findAll('.label').map((l) => l.text()).filter(Boolean)
    expect(labelTexts).toHaveLength(3)
    expect(labelTexts[2]).toBe('4.9.') // Intl.DateTimeFormat('de', numeric day.month)
    // labels are bidi-isolated for RTL locales
    expect(views.findAll('.label bdi').length).toBeGreaterThan(0)

    const reports = wrapper.find('[data-test="reports-chart"]')
    expect(reports.text()).toContain('Meldungen pro Tag')
    expect(reports.findAll('.bar')).toHaveLength(14)
    expect(reports.find('.value').text()).toBe('8')
  })

  it('renders zero days as hairlines', async () => {
    const stats = {
      ...STATS,
      usage14d: STATS.usage14d.map((entry) => ({ ...entry, reports: 0 })),
    }
    fetchMock.mockResolvedValue(jsonResponse(stats))

    const wrapper = mountStatistik()
    await flushPromises()

    for (const bar of wrapper.find('[data-test="reports-chart"]').findAll('.bar')) {
      expect(bar.element.style.height).toBe('2px')
    }
  })

  it('fails silently with a muted line when the fetch fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const wrapper = mountStatistik()
    await flushPromises()

    expect(wrapper.find('[data-test="stats-unavailable"]').text()).toBe(
      'Gerade nicht verfügbar.',
    )
    expect(wrapper.find('[data-test="tiles"]').exists()).toBe(false)
    expect(wrapper.findAll('.bar')).toHaveLength(0)
  })
})
