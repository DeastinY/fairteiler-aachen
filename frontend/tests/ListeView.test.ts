import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetFilters } from '../src/composables/useFilters'
import ListeView from '../src/views/ListeView.vue'
import { jsonResponse, makeFairteiler } from './fixtures'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
  resetFilters()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

function mountListe() {
  return mount(ListeView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('ListeView', () => {
  it('shows skeleton cards while pending and replaces them after resolve', async () => {
    let resolve!: (value: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)))
    const wrapper = mountListe()

    expect(wrapper.findAll('[data-test="skeleton-card"]')).toHaveLength(3)
    // loading is announced for screen readers, not shown as bare text
    expect(wrapper.find('[role="status"]').text()).toBe('Lade Fairteiler …')

    resolve(jsonResponse([makeFairteiler({ id: 1, name: 'Pfannenzauber' })]))
    await flushPromises()

    expect(wrapper.findAll('[data-test="skeleton-card"]')).toHaveLength(0)
    expect(wrapper.findAll('.listecard')).toHaveLength(1)
  })

  it('shows an empty state when the API returns no fairteiler', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))
    const wrapper = mountListe()
    await flushPromises()
    expect(wrapper.find('[data-test="empty"]').text()).toBe(
      'Noch keine Fairteiler eingetragen.',
    )
  })

  it('sorts by last reported (nulls last) when that chip is selected', async () => {
    const at = (minAgo: number) => new Date(Date.now() - minAgo * 60_000).toISOString()
    fetchMock.mockResolvedValue(
      jsonResponse([
        makeFairteiler({ id: 1, name: 'Ohne Meldung' }),
        makeFairteiler({
          id: 2,
          name: 'Alt',
          status: { state: 'etwas_da', lastReportAt: at(300), tags: [] },
        }),
        makeFairteiler({
          id: 3,
          name: 'Frisch',
          status: { state: 'leer', lastReportAt: at(10), tags: [] },
        }),
      ]),
    )

    const wrapper = mountListe()
    await flushPromises()

    await wrapper.find('[data-test="sort-lastReported"]').trigger('click')
    const names = wrapper.findAll('.listecard .name').map((n) => n.text())
    expect(names).toEqual(['Frisch', 'Alt', 'Ohne Meldung'])
    expect(localStorage.getItem('fairteiler-list-sort')).toBe('lastReported')
  })

  it('distance sort asks for geolocation, orders by distance and shows distances', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 50.7766, longitude: 6.0834 } } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    fetchMock.mockResolvedValue(
      jsonResponse([
        makeFairteiler({ id: 1, name: 'Fern', lat: 50.9, lon: 6.3 }),
        makeFairteiler({ id: 2, name: 'Nah', lat: 50.777, lon: 6.084 }),
      ]),
    )

    const wrapper = mountListe()
    await flushPromises()

    await wrapper.find('[data-test="sort-distance"]').trigger('click')
    await flushPromises()

    expect(getCurrentPosition).toHaveBeenCalled()
    const names = wrapper.findAll('.listecard .name').map((n) => n.text())
    expect(names).toEqual(['Nah', 'Fern'])
    const distances = wrapper.findAll('[data-test="distance"]')
    expect(distances).toHaveLength(2)
    expect(distances[0]!.text()).toMatch(/\d+ m|\d+,\d km/)
  })

  it('falls back to activity with a hint when geolocation is denied', async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, geoError?: PositionErrorCallback) => {
        geoError?.({ code: 1, message: 'denied' } as GeolocationPositionError)
      },
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    fetchMock.mockResolvedValue(jsonResponse([makeFairteiler({ id: 1 })]))

    const wrapper = mountListe()
    await flushPromises()

    await wrapper.find('[data-test="sort-distance"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="geo-hint"]').text()).toContain('Standort nicht verfügbar')
    expect(wrapper.find('[data-test="sort-activity"]').attributes('aria-pressed')).toBe('true')
    expect(localStorage.getItem('fairteiler-list-sort')).toBe('activity')
  })

  it('renders cards with names and German status labels, sorted', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        makeFairteiler({ id: 1, name: 'Pfannenzauber' }),
        makeFairteiler({
          id: 2,
          name: 'Hirschgrün',
          status: {
            state: 'etwas_da',
            lastReportAt: new Date(Date.now() - 18 * 60_000).toISOString(),
            tags: ['brot_backwaren', 'gemuese'],
          },
          activity7d: [1, 2, 1, 3, 2, 2, 5],
        }),
        makeFairteiler({
          id: 3,
          name: 'Kleinkölnstraße',
          status: {
            state: 'leer',
            lastReportAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
            tags: [],
          },
          activity7d: [3, 3, 3, 3, 3, 3, 3],
        }),
      ]),
    )

    const wrapper = mountListe()
    await flushPromises()

    const cards = wrapper.findAll('.listecard')
    expect(cards).toHaveLength(3)

    // etwas_da first, then by activity
    expect(cards[0]!.text()).toContain('Hirschgrün')
    expect(cards[0]!.text()).toContain('Etwas da')
    expect(cards[0]!.text()).toContain('vor 18 Min')
    expect(cards[0]!.text()).toContain('Brot & Backwaren, Gemüse')

    expect(cards[1]!.text()).toContain('Kleinkölnstraße')
    expect(cards[1]!.text()).toContain('Leer gemeldet')
    expect(cards[1]!.text()).toContain('vor 2 Std')

    expect(cards[2]!.text()).toContain('Pfannenzauber')
    expect(cards[2]!.text()).toContain('Keine aktuelle Meldung')

    // header summary
    expect(wrapper.text()).toContain('3 Standorte')
    expect(wrapper.text()).toContain('2 mit aktueller Meldung')
  })

  it('shows care badges from the care flags', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        makeFairteiler({
          id: 1,
          name: 'Mit Problemen',
          care: { needsCleaning: true, needsMaintenance: true },
        }),
        makeFairteiler({ id: 2, name: 'Alles gut' }),
      ]),
    )

    const wrapper = mountListe()
    await flushPromises()

    const cards = wrapper.findAll('.listecard')
    const problem = cards.find((c) => c.text().includes('Mit Problemen'))!
    expect(problem.text()).toContain('Reinigung nötig')
    expect(problem.find('.badge-warn').text()).toBe('Defekt gemeldet')

    const fine = cards.find((c) => c.text().includes('Alles gut'))!
    expect(fine.text()).not.toContain('Reinigung nötig')
    expect(fine.find('.badge-warn').exists()).toBe(false)
  })

  it('shows subtle open/closed hints from openNow', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        makeFairteiler({ id: 1, name: 'Zu', openNow: false }),
        makeFairteiler({ id: 2, name: 'Offen', openNow: true }),
        makeFairteiler({ id: 3, name: 'Immer', openNow: true, aroundTheClock: true }),
        makeFairteiler({ id: 4, name: 'Unbekannt', openNow: null }),
      ]),
    )

    const wrapper = mountListe()
    await flushPromises()

    const cards = wrapper.findAll('.listecard')
    const byName = (name: string) => cards.find((c) => c.text().includes(name))!
    expect(byName('Zu').text()).toContain('Geschlossen')
    expect(byName('Offen').text()).toContain('Jetzt geöffnet')
    // 24/7 places don't need a redundant hint
    expect(byName('Immer').text()).not.toContain('Jetzt geöffnet')
    expect(byName('Unbekannt').text()).not.toContain('Geschlossen')
    expect(byName('Unbekannt').text()).not.toContain('Jetzt geöffnet')
  })

  it('the "Jetzt offen" chip filters to known-open places only', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        makeFairteiler({ id: 1, name: 'Zu', openNow: false }),
        makeFairteiler({ id: 2, name: 'Offen', openNow: true }),
        makeFairteiler({ id: 3, name: 'Unbekannt', openNow: null }),
      ]),
    )

    const wrapper = mountListe()
    await flushPromises()

    const chip = wrapper.findAll('.filterchip').find((c) => c.text() === 'Jetzt offen')!
    await chip.trigger('click')

    const cards = wrapper.findAll('.listecard')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Offen')
  })

  it('filter chips reduce the rendered cards', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        makeFairteiler({ id: 1, name: 'Pfannenzauber', cooled: true }),
        makeFairteiler({
          id: 2,
          name: 'Hirschgrün',
          status: {
            state: 'etwas_da',
            lastReportAt: new Date().toISOString(),
            tags: [],
          },
        }),
      ]),
    )

    const wrapper = mountListe()
    await flushPromises()
    expect(wrapper.findAll('.listecard')).toHaveLength(2)

    // baskets are a map-only concept – no chip on the Liste
    expect(
      wrapper.findAll('.filterchip').some((c) => c.text() === 'Essenskörbe'),
    ).toBe(false)

    const etwasDa = wrapper.findAll('.filterchip').find((c) => c.text() === 'Etwas da')!
    await etwasDa.trigger('click')
    expect(etwasDa.attributes('aria-pressed')).toBe('true')
    const cards = wrapper.findAll('.listecard')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('Hirschgrün')

    // AND with cooled -> nothing matches, German empty state
    const cooled = wrapper.findAll('.filterchip').find((c) => c.text() === 'Gekühlt')!
    await cooled.trigger('click')
    expect(wrapper.findAll('.listecard')).toHaveLength(0)
    expect(wrapper.text()).toContain('Keine Fairteiler entsprechen den gewählten Filtern.')
  })

  it('shows a German error with retry on failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const wrapper = mountListe()
    await flushPromises()

    expect(wrapper.text()).toContain('konnten nicht geladen werden')
    expect(wrapper.find('button.retrybtn').text()).toBe('Erneut versuchen')
  })
})
