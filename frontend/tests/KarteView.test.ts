import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import KarteView from '../src/views/KarteView.vue'
import { jsonResponse, makeFairteiler } from './fixtures'

const fetchMock = vi.fn()
const routerPush = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => ({ push: routerPush }),
  }
})

const LIST = [
  makeFairteiler({
    id: 1,
    name: 'Hirschgrün',
    lat: 50.77,
    lon: 6.08,
    status: {
      state: 'etwas_da',
      lastReportAt: new Date(Date.now() - 18 * 60_000).toISOString(),
      tags: ['gemuese'],
    },
    activity7d: [1, 1, 1, 1, 1, 1, 2],
  }),
  makeFairteiler({
    id: 2,
    name: 'Kleinkölnstraße',
    lat: 50.78,
    lon: 6.09,
    status: {
      state: 'leer',
      lastReportAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      tags: [],
    },
  }),
  makeFairteiler({ id: 3, name: 'Pfannenzauber', lat: 50.76, lon: 6.1 }),
]

function mountKarte() {
  return mount(KarteView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(jsonResponse(LIST))
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
  routerPush.mockReset()
})

describe('KarteView', () => {
  it('renders one pin per fairteiler with the status class', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    const pins = wrapper.findAll('.pin')
    expect(pins).toHaveLength(3)

    const classesById = pins.map((p) => p.classes())
    expect(classesById[0]).toContain('etwas_da')
    expect(classesById[1]).toContain('leer')
    expect(classesById[2]).toContain('keine_meldung')

    // pins carry a 44px+ hit area (r=22 transparent circle)
    for (const pin of pins) {
      expect(pin.find('circle[r="22"]').exists()).toBe(true)
    }
  })

  it('positions pins by projected coordinates (west pin left of east pin)', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    const pins = wrapper.findAll('.pin')
    const cx = (i: number) => Number(pins[i]!.find('circle[r="9"]').attributes('cx'))
    const cy = (i: number) => Number(pins[i]!.find('circle[r="9"]').attributes('cy'))

    // Hirschgrün (lon 6.08) is west of Pfannenzauber (lon 6.10)
    expect(cx(0)).toBeLessThan(cx(2))
    // Kleinkölnstraße (lat 50.78) is north of Pfannenzauber (lat 50.76)
    expect(cy(1)).toBeLessThan(cy(2))
  })

  it('opens the detail route when a pin is activated', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    await wrapper.findAll('.pin')[1]!.trigger('click')
    expect(routerPush).toHaveBeenCalledWith('/fairteiler/2')

    await wrapper.findAll('.pin')[0]!.trigger('keydown.enter')
    expect(routerPush).toHaveBeenCalledWith('/fairteiler/1')
  })

  it('shows the summary, the Schemakarte caption and the top-3 rows', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    expect(wrapper.text()).toContain('2 von 3 mit aktueller Meldung')
    expect(wrapper.text()).toContain('Schemakarte')

    const rows = wrapper.findAll('.nearrow')
    expect(rows).toHaveLength(3)
    // default sort: etwas_da first
    expect(rows[0]!.text()).toContain('Hirschgrün')
    expect(rows[0]!.text()).toContain('Etwas da')
    expect(rows[0]!.text()).toContain('vor 18 Min')
  })

  it('sorts rows by distance and shows the user dot after geolocation', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 50.761, longitude: 6.099 },
      } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    const wrapper = mountKarte()
    await flushPromises()

    await wrapper.find('.locbtn').trigger('click')
    await flushPromises()

    expect(getCurrentPosition).toHaveBeenCalled()
    // nearest to (50.761, 6.099) is Pfannenzauber (50.76, 6.10)
    const rows = wrapper.findAll('.nearrow')
    expect(rows[0]!.text()).toContain('Pfannenzauber')
    expect(rows[0]!.text()).toMatch(/\d+ m|\d+,\d km/)
    expect(wrapper.find('.userdot').exists()).toBe(true)
  })

  it('shows a German hint when geolocation is denied', async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, geoError?: PositionErrorCallback) => {
        geoError?.({ code: 1, message: 'denied' } as GeolocationPositionError)
      },
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    const wrapper = mountKarte()
    await flushPromises()

    await wrapper.find('.locbtn').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Standort nicht verfügbar')
    expect(wrapper.find('.userdot').exists()).toBe(false)
  })
})
