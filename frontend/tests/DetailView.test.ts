import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rememberOwnReport } from '../src/composables/ownReports'
import { useToast } from '../src/composables/useToast'
import DetailView from '../src/views/DetailView.vue'
import { jsonResponse, makeDetail } from './fixtures'

const fetchMock = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRoute: () => ({ params: { id: '810' } }),
    useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  }
})

const OWN_CREATED_AT = new Date(Date.now() - 5 * 60_000).toISOString()
const FOREIGN_CREATED_AT = new Date(Date.now() - 10 * 60_000).toISOString()

const DETAIL = makeDetail({
  id: 810,
  reports: [
    { id: 42, type: 'brought', tags: ['obst'], createdAt: OWN_CREATED_AT },
    { id: 99, type: 'empty', tags: [], createdAt: FOREIGN_CREATED_AT },
  ],
})

function mountDetail() {
  return mount(DetailView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    if (url === '/api/fairteiler/810') return Promise.resolve(jsonResponse(DETAIL))
    throw new Error(`unexpected fetch: ${url}`)
  })
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('DetailView', () => {
  it('renders name, escaped description paragraphs and German report labels', async () => {
    const wrapper = mountDetail()
    await flushPromises()

    expect(wrapper.text()).toContain('Fairteiler "BreitSeite"')
    expect(wrapper.text()).toContain('Öffnungszeiten: rund um die Uhr.')
    expect(wrapper.text()).toContain('Etwas gebracht · Obst')
    expect(wrapper.text()).toContain('Leer gemeldet')
    // description is rendered as text, never as HTML
    expect(wrapper.find('.para').element.innerHTML).not.toContain('<script')
  })

  it('shows Zurücknehmen only for own recent reports', async () => {
    rememberOwnReport({ id: 42, fairteilerId: 810, createdAt: OWN_CREATED_AT })

    const wrapper = mountDetail()
    await flushPromises()

    const rows = wrapper.findAll('.reportrow')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.find('.undobtn').exists()).toBe(true)
    expect(rows[1]!.find('.undobtn').exists()).toBe(false)
  })

  it('deletes the own report and refreshes on Zurücknehmen', async () => {
    rememberOwnReport({ id: 42, fairteilerId: 810, createdAt: OWN_CREATED_AT })

    const wrapper = mountDetail()
    await flushPromises()

    await wrapper.find('.undobtn').trigger('click')
    await flushPromises()

    const del = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')!
    expect(del[0]).toBe('/api/reports/42')
    expect(del[1].headers['X-Device-Id']).toBeTruthy()

    const toast = useToast()
    expect(toast.message).toBe('Meldung zurückgenommen.')
    // detail reloaded after the delete
    const detailCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/fairteiler/810')
    expect(detailCalls.length).toBe(2)
    // stored own report is gone -> no more undo buttons
    expect(wrapper.findAll('.undobtn')).toHaveLength(0)
  })

  it('surfaces the backend detail message on 403', async () => {
    rememberOwnReport({ id: 42, fairteilerId: 810, createdAt: OWN_CREATED_AT })
    const detailMessage =
      'Eigene Meldungen lassen sich nur innerhalb von 15 Minuten zurücknehmen.'
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return Promise.resolve(jsonResponse({ detail: detailMessage }, 403))
      }
      if (url === '/api/fairteiler/810') return Promise.resolve(jsonResponse(DETAIL))
      throw new Error(`unexpected fetch: ${url}`)
    })

    const wrapper = mountDetail()
    await flushPromises()
    await wrapper.find('.undobtn').trigger('click')
    await flushPromises()

    expect(useToast().message).toBe(detailMessage)
  })

  it('shows care badges and German labels for condition reports', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/fairteiler/810') {
        return Promise.resolve(
          jsonResponse(
            makeDetail({
              id: 810,
              care: { needsCleaning: true, needsMaintenance: true },
              reports: [
                { id: 1, type: 'needs_cleaning', tags: [], createdAt: FOREIGN_CREATED_AT },
                { id: 2, type: 'needs_maintenance', tags: [], createdAt: FOREIGN_CREATED_AT },
                { id: 3, type: 'cleaned', tags: [], createdAt: FOREIGN_CREATED_AT },
              ],
            }),
          ),
        )
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const wrapper = mountDetail()
    await flushPromises()

    expect(wrapper.find('.badge-amber').text()).toBe('Reinigung nötig')
    expect(wrapper.find('.badge-warn').text()).toBe('Defekt gemeldet')

    const rows = wrapper.findAll('.reportrow')
    expect(rows[0]!.text()).toContain('Reinigung nötig gemeldet')
    expect(rows[1]!.text()).toContain('Defekt gemeldet')
    expect(rows[2]!.text()).toContain('Gereinigt / in Ordnung gebracht')
  })

  it('renders the opening hours table with today emphasized, except for 24/7 places', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/fairteiler/810') {
        return Promise.resolve(
          jsonResponse(
            makeDetail({ id: 810, hours: { mo: [[10, 18]], sa: [[10, 16.5]] } }),
          ),
        )
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const wrapper = mountDetail()
    await flushPromises()

    const table = wrapper.find('[data-test="hours"]')
    expect(table.exists()).toBe(true)
    const rows = table.findAll('.hoursrow')
    expect(rows).toHaveLength(7)
    expect(rows[0]!.text()).toContain('Mo')
    expect(rows[0]!.text()).toContain('10–18 Uhr')
    expect(rows[1]!.text()).toContain('Geschlossen')
    expect(rows[5]!.text()).toContain('10–16:30 Uhr')
    expect(table.findAll('.hoursrow.today')).toHaveLength(1)

    // 24/7 place: chip instead of table
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          makeDetail({ id: 810, aroundTheClock: true, hours: { mo: [[0, 24]] } }),
        ),
      ),
    )
    const wrapper247 = mountDetail()
    await flushPromises()
    expect(wrapper247.find('[data-test="hours"]').exists()).toBe(false)
    expect(wrapper247.text()).toContain('Rund um die Uhr')
  })

  it('hides the hours block when hours are unknown', async () => {
    const wrapper = mountDetail() // fixture has hours: null
    await flushPromises()
    expect(wrapper.find('[data-test="hours"]').exists()).toBe(false)
  })

  it('links to the fairteiler page on foodsharing.de', async () => {
    const wrapper = mountDetail()
    await flushPromises()

    const link = wrapper.find('a.fslink')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Auf foodsharing.de ansehen')
    expect(link.attributes('href')).toBe('https://foodsharing.de/fairteiler/810')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('shows the best-time hint for all three times and nothing for null', async () => {
    const cases = [
      ['morning', 'Meist wird vormittags etwas gebracht.'],
      ['afternoon', 'Meist wird nachmittags etwas gebracht.'],
      ['evening', 'Meist wird abends etwas gebracht.'],
    ] as const
    for (const [bestTime, text] of cases) {
      fetchMock.mockImplementation(() =>
        Promise.resolve(jsonResponse(makeDetail({ id: 810, bestTime }))),
      )
      const wrapper = mountDetail()
      await flushPromises()
      expect(wrapper.find('[data-test="best-time"]').text()).toBe(text)
      wrapper.unmount()
    }

    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse(makeDetail({ id: 810, bestTime: null }))),
    )
    const wrapper = mountDetail()
    await flushPromises()
    expect(wrapper.find('[data-test="best-time"]').exists()).toBe(false)
  })

  it('shares via navigator.share with title and url', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { onLine: true, share })

    const wrapper = mountDetail()
    await flushPromises()

    await wrapper.find('[data-test="share"]').trigger('click')
    expect(share).toHaveBeenCalledWith({
      title: 'Fairteiler "BreitSeite"',
      url: window.location.href,
    })
  })

  it('falls back to the clipboard with a toast when share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { onLine: true, clipboard: { writeText } })

    const wrapper = mountDetail()
    await flushPromises()

    await wrapper.find('[data-test="share"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(useToast().message).toBe('Link kopiert.')
  })

  it('hides the share button when neither API exists', async () => {
    vi.stubGlobal('navigator', { onLine: true })

    const wrapper = mountDetail()
    await flushPromises()

    expect(wrapper.find('[data-test="share"]').exists()).toBe(false)
  })

  it('shows a skeleton while loading, replaced by the content', async () => {
    let resolve!: (value: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)))
    const wrapper = mountDetail()

    expect(wrapper.find('[data-test="skeletons"]').exists()).toBe(true)

    resolve(jsonResponse(DETAIL))
    await flushPromises()

    expect(wrapper.find('[data-test="skeletons"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Fairteiler "BreitSeite"')
  })

  it('links the Route button to the platform navigation app', async () => {
    const wrapper = mountDetail()
    await flushPromises()

    const route = wrapper.find('a.routebtn')
    expect(route.exists()).toBe(true)
    expect(route.attributes('rel')).toBe('noopener noreferrer')
    expect(route.attributes('target')).toBe('_blank')
    // happy-dom UA is neither iOS nor Android -> OSM fallback
    expect(route.attributes('href')).toContain('openstreetmap.org/directions')
    expect(route.attributes('href')).toContain('50.7766')
  })
})
