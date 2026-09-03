import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ListeView from '../src/views/ListeView.vue'
import { jsonResponse, makeFairteiler } from './fixtures'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
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
  it('shows a German loading state first', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const wrapper = mountListe()
    expect(wrapper.text()).toContain('Lade Fairteiler')
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

  it('shows a German error with retry on failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const wrapper = mountListe()
    await flushPromises()

    expect(wrapper.text()).toContain('konnten nicht geladen werden')
    expect(wrapper.find('button.retrybtn').text()).toBe('Erneut versuchen')
  })
})
