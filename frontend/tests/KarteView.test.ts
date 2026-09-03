import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetFilters } from '../src/composables/useFilters'
import KarteView from '../src/views/KarteView.vue'
import { jsonResponse, makeFairteiler } from './fixtures'

const leaflet = vi.hoisted(() => {
  interface MarkerRecord {
    latlng: [number, number]
    options: Record<string, unknown>
    handlers: Record<string, () => void>
  }
  const markers: MarkerRecord[] = []
  const mapObj = { fitBounds: vi.fn(), remove: vi.fn() }
  const layerGroup = {
    addTo: vi.fn(),
    clearLayers: vi.fn(),
    addLayer: vi.fn(),
  }
  layerGroup.addTo.mockReturnValue(layerGroup)
  const tileLayerObj = { addTo: vi.fn() }
  const L = {
    map: vi.fn(() => mapObj),
    tileLayer: vi.fn(() => tileLayerObj),
    layerGroup: vi.fn(() => layerGroup),
    latLngBounds: vi.fn((points: [number, number][]) => points),
    point: vi.fn((x: number, y: number) => ({ x, y })),
    circleMarker: vi.fn((latlng: [number, number], options: Record<string, unknown>) => {
      const record: MarkerRecord = { latlng, options, handlers: {} }
      markers.push(record)
      const marker = {
        on(event: string, cb: () => void) {
          record.handlers[event] = cb
          return marker
        },
        bindTooltip: () => marker,
        addTo: () => marker,
        remove: vi.fn(),
      }
      return marker
    }),
  }
  return { L, markers, mapObj, layerGroup }
})

vi.mock('leaflet', () => ({ default: leaflet.L }))

const fetchMock = vi.fn()
const routerPush = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: routerPush }) }
})

const LIST = [
  makeFairteiler({
    id: 1,
    name: 'Hirschgrün',
    lat: 50.77,
    lon: 6.08,
    aroundTheClock: true,
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
    cooled: true,
    status: {
      state: 'leer',
      lastReportAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      tags: [],
    },
  }),
  makeFairteiler({ id: 3, name: 'Pfannenzauber', lat: 50.76, lon: 6.1 }),
]

enableAutoUnmount(afterEach)

function mountKarte() {
  return mount(KarteView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

/** Hit markers are the invisible radius-22 circles carrying the click handler. */
function hitMarkers() {
  return leaflet.markers.filter((m) => m.options['radius'] === 22)
}

function visualMarkers() {
  return leaflet.markers.filter((m) => m.options['radius'] === 10)
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(LIST)))
  localStorage.clear()
  resetFilters()
  leaflet.markers.length = 0
  vi.clearAllMocks()
  fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(LIST)))
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('KarteView (Leaflet)', () => {
  it('creates the map with basemap.de tiles, attribution and fitted bounds', async () => {
    mountKarte()
    await flushPromises()

    expect(leaflet.L.map).toHaveBeenCalledTimes(1)
    const [url, options] = leaflet.L.tileLayer.mock.calls[0]!
    expect(url).toBe(
      'https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_farbe/default/GLOBAL_WEBMERCATOR/{z}/{y}/{x}.png',
    )
    expect(options.maxZoom).toBe(18)
    expect(options.attribution).toContain('basemap.de')
    expect(options.attribution).toContain('BKG')
    expect(leaflet.mapObj.fitBounds).toHaveBeenCalled()
  })

  it('renders a status-colored marker plus a 44px hit circle per fairteiler', async () => {
    mountKarte()
    await flushPromises()

    const visuals = visualMarkers()
    expect(visuals).toHaveLength(3)
    expect(hitMarkers()).toHaveLength(3)

    expect(visuals[0]!.options['fillColor']).toBe('#2f7d54') // etwas_da
    expect(visuals[1]!.options['fillColor']).toBe('#6b7570') // leer
    expect(visuals[2]!.options['fillColor']).toBe('#c08a1e') // keine_meldung
    for (const visual of visuals) {
      expect(visual.options['color']).toBe('#fdfcf8')
    }
    for (const hit of hitMarkers()) {
      expect(hit.options['fillOpacity']).toBe(0)
    }
  })

  it('opens the detail route when a marker is tapped', async () => {
    mountKarte()
    await flushPromises()

    hitMarkers()[1]!.handlers['click']!()
    expect(routerPush).toHaveBeenCalledWith('/fairteiler/2')
  })

  it('filter chips reduce the rendered markers and rows', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    expect(wrapper.findAll('.nearrow')).toHaveLength(3)

    leaflet.markers.length = 0
    const etwasDaChip = wrapper
      .findAll('.filterchip')
      .find((c) => c.text() === 'Etwas da')!
    await etwasDaChip.trigger('click')
    await flushPromises()

    expect(etwasDaChip.attributes('aria-pressed')).toBe('true')
    expect(hitMarkers()).toHaveLength(1)
    expect(visualMarkers()[0]!.options['fillColor']).toBe('#2f7d54')
    const rows = wrapper.findAll('.nearrow')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text()).toContain('Hirschgrün')

    // AND with a second chip that matches nothing reported
    const cooledChip = wrapper.findAll('.filterchip').find((c) => c.text() === 'Gekühlt')!
    await cooledChip.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.nearrow')).toHaveLength(0)
    expect(wrapper.text()).toContain('Keine Fairteiler entsprechen den gewählten Filtern.')
  })

  it('shows the user dot and sorts rows by distance after geolocation', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 50.761, longitude: 6.099 } } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    const wrapper = mountKarte()
    await flushPromises()

    await wrapper.find('.locbtn').trigger('click')
    await flushPromises()

    const userDot = leaflet.markers.find((m) => m.options['fillColor'] === '#3b6ea5')
    expect(userDot).toBeTruthy()
    expect(userDot!.latlng).toEqual([50.761, 6.099])

    const rows = wrapper.findAll('.nearrow')
    expect(rows[0]!.text()).toContain('Pfannenzauber')
    expect(rows[0]!.text()).toMatch(/\d+ m|\d+,\d km/)
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
  })

  it('asks for location automatically only when the setting is on', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 50.76, longitude: 6.09 } } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    const first = mountKarte()
    await flushPromises()
    expect(getCurrentPosition).not.toHaveBeenCalled()
    first.unmount()

    localStorage.setItem('fairteiler-auto-locate', 'true')
    mountKarte()
    await flushPromises()
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  })
})
