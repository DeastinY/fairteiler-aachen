import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetFilters } from '../src/composables/useFilters'
import KarteView from '../src/views/KarteView.vue'
import { jsonResponse, makeFairteiler } from './fixtures'

const leaflet = vi.hoisted(() => {
  interface MarkerRecord {
    latlng: [number, number]
    options: Record<string, unknown> & { icon?: { html?: string; className?: string } }
    handlers: Record<string, () => void>
    element: HTMLElement
    removed: boolean
  }
  interface CircleRecord {
    latlng: [number, number]
    options: Record<string, unknown>
    removed: boolean
  }
  const markers: MarkerRecord[] = []
  const circles: CircleRecord[] = []
  const mapHandlers: Record<string, () => void> = {}
  const mapObj = {
    fitBounds: vi.fn(),
    remove: vi.fn(),
    flyTo: vi.fn(),
    flyToBounds: vi.fn(),
    on: vi.fn((event: string, cb: () => void) => {
      mapHandlers[event] = cb
    }),
  }
  interface LayerGroupMock {
    addTo: (target: unknown) => LayerGroupMock
    clearLayers: () => void
    addLayer: (layer: { __record?: MarkerRecord }) => void
    __members: MarkerRecord[]
  }
  function makeLayerGroup(): LayerGroupMock {
    const group: LayerGroupMock = {
      __members: [],
      addTo: () => group,
      clearLayers: () => {
        for (const member of group.__members) {
          const index = markers.indexOf(member)
          if (index !== -1) markers.splice(index, 1)
        }
        group.__members.length = 0
      },
      addLayer: (layer) => {
        if (layer.__record) group.__members.push(layer.__record)
      },
    }
    return group
  }
  const tileLayerObj = { addTo: vi.fn() }
  const zoomControl = { addTo: vi.fn() }
  const L = {
    map: vi.fn(() => mapObj),
    tileLayer: vi.fn(() => tileLayerObj),
    layerGroup: vi.fn(() => makeLayerGroup()),
    latLngBounds: vi.fn((points: [number, number][]) => points),
    point: vi.fn((x: number, y: number) => ({ x, y })),
    divIcon: vi.fn((options: Record<string, unknown>) => options),
    control: { zoom: vi.fn(() => zoomControl) },
    marker: vi.fn(
      (latlng: [number, number], options: Record<string, unknown>) => {
        const element = document.createElement('div')
        const record: (typeof markers)[number] = {
          latlng,
          options: options as (typeof markers)[number]['options'],
          handlers: {},
          element,
          removed: false,
        }
        markers.push(record)
        const marker = {
          __record: record,
          on(event: string, cb: () => void) {
            record.handlers[event] = cb
            return marker
          },
          addTo: () => marker,
          remove: vi.fn(() => {
            record.removed = true
          }),
          getElement: () => element,
        }
        return marker
      },
    ),
    circle: vi.fn((latlng: [number, number], options: Record<string, unknown>) => {
      const record: (typeof circles)[number] = { latlng, options, removed: false }
      circles.push(record)
      return {
        addTo: () => record,
        remove: vi.fn(() => {
          record.removed = true
        }),
      }
    }),
  }
  return { L, markers, circles, mapObj, mapHandlers, zoomControl }
})

vi.mock('leaflet', () => ({ default: leaflet.L }))

const fetchMock = vi.fn()
const routerPush = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: routerPush }) }
})

const BASKETS = {
  baskets: [{ id: 7001, lat: 50.775, lon: 6.095 }],
  fetchedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  stale: false,
}

let basketsResponse: () => Promise<Response> = () =>
  Promise.resolve(jsonResponse(BASKETS))

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

/** Fairteiler pins = markers whose icon carries the pin class. */
function pins() {
  return leaflet.markers.filter((m) =>
    String(m.options.icon?.className ?? '').includes('pin-wrap'),
  )
}

function basketPins() {
  return leaflet.markers.filter((m) =>
    String(m.options.icon?.className ?? '').includes('basket-wrap'),
  )
}

function mockFetch() {
  fetchMock.mockImplementation((url: string) => {
    if (url === '/api/baskets') return basketsResponse()
    return Promise.resolve(jsonResponse(LIST))
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  basketsResponse = () => Promise.resolve(jsonResponse(BASKETS))
  localStorage.clear()
  resetFilters()
  leaflet.markers.length = 0
  leaflet.circles.length = 0
  for (const key of Object.keys(leaflet.mapHandlers)) delete leaflet.mapHandlers[key]
  vi.clearAllMocks()
  mockFetch()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('KarteView (OSM tiles + navigation-like interaction)', () => {
  it('creates the map with OSM Germany tiles, attribution and a zoom control', async () => {
    mountKarte()
    await flushPromises()

    const [url, options] = leaflet.L.tileLayer.mock.calls[0]!
    expect(url).toBe('https://tile.openstreetmap.de/{z}/{x}/{y}.png')
    expect(options.maxZoom).toBe(19)
    expect(options.attribution).toContain('openstreetmap.org/copyright')
    expect(options.attribution).toContain('OpenStreetMap')
    expect(options.attribution).toContain('Mitwirkende')
    expect(leaflet.L.control.zoom).toHaveBeenCalledWith({ position: 'bottomright' })
    expect(leaflet.zoomControl.addTo).toHaveBeenCalled()
    expect(leaflet.mapObj.fitBounds).toHaveBeenCalled()
  })

  it('renders one teardrop pin per fairteiler, status-colored and named', async () => {
    mountKarte()
    await flushPromises()

    const rendered = pins()
    expect(rendered).toHaveLength(3)
    // status colors live in the divIcon svg (graphics palette, not retinted)
    expect(rendered[0]!.options.icon?.html).toContain('#2f7d54') // etwas_da
    expect(rendered[1]!.options.icon?.html).toContain('#6b7570') // leer
    expect(rendered[2]!.options.icon?.html).toContain('#c08a1e') // keine_meldung
    for (const pin of rendered) {
      expect(pin.options.icon?.html).toContain('<svg')
      expect(pin.element.getAttribute('role')).toBe('button')
      expect(pin.element.getAttribute('tabindex')).toBe('0')
    }
    expect(rendered[0]!.element.getAttribute('aria-label')).toBe('Hirschgrün')
  })

  it('first tap selects (flyTo + card + bigger pin), second tap opens details', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    pins()[1]!.handlers['click']!()
    await flushPromises()

    // flew to the neighborhood bounds (selected + in-range neighbors), capped zoom
    expect(leaflet.mapObj.flyToBounds).toHaveBeenCalledTimes(1)
    const [bounds, options] = leaflet.mapObj.flyToBounds.mock.calls[0]!
    // selected first, then both neighbors (all within 3 km of each other)
    expect(bounds[0]).toEqual([50.78, 6.09])
    expect(bounds).toHaveLength(3)
    expect(options.maxZoom).toBe(16)
    expect(options.animate).toBe(true)
    expect(options.paddingTopLeft[1]).toBeGreaterThanOrEqual(120) // clears topbar+chips
    expect(leaflet.mapObj.flyTo).not.toHaveBeenCalled()
    // no navigation yet
    expect(routerPush).not.toHaveBeenCalled()

    // sheet shows the selection card with Route + Details
    const card = wrapper.find('[data-test="selection-card"]')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('Kleinkölnstraße')
    expect(card.text()).toContain('Leer gemeldet')
    const route = card.find('a.selroute')
    expect(route.attributes('rel')).toBe('noopener noreferrer')
    expect(route.attributes('href')).toContain('50.78')

    // selected pin is re-rendered larger with the selected class
    const selectedPin = pins().find((p) =>
      String(p.options.icon?.className).includes('pin-selected'),
    )
    expect(selectedPin).toBeTruthy()
    expect(selectedPin!.latlng).toEqual([50.78, 6.09])

    // selection is announced for AT
    expect(wrapper.find('[role="status"]').text()).toContain('Kleinkölnstraße')

    // second tap on the same pin → details
    const samePin = pins().find((p) => p.latlng[0] === 50.78)!
    samePin.handlers['click']!()
    expect(routerPush).toHaveBeenCalledWith('/fairteiler/2')
  })

  it('flies straight to a remote pin at zoom 14 (no neighbors within 3 km)', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/baskets') return basketsResponse()
      return Promise.resolve(
        jsonResponse([
          ...LIST,
          makeFairteiler({ id: 9, name: 'Hauset', lat: 50.71, lon: 6.24 }),
        ]),
      )
    })

    mountKarte()
    await flushPromises()

    const remote = pins().find((p) => p.latlng[0] === 50.71)!
    remote.handlers['click']!()
    await flushPromises()

    expect(leaflet.mapObj.flyToBounds).not.toHaveBeenCalled()
    expect(leaflet.mapObj.flyTo).toHaveBeenCalledWith([50.71, 6.24], 14, {
      animate: true,
    })
  })

  it('Details button navigates, X and map tap deselect', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    pins()[0]!.handlers['click']!()
    await flushPromises()
    await wrapper.find('[data-test="selection-details"]').trigger('click')
    expect(routerPush).toHaveBeenCalledWith('/fairteiler/1')

    // X closes the card
    await wrapper.find('[data-test="deselect"]').trigger('click')
    expect(wrapper.find('[data-test="selection-card"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Hirschgrün') // top-3 list is back

    // select again, then tap empty map
    pins()[0]!.handlers['click']!()
    await flushPromises()
    expect(wrapper.find('[data-test="selection-card"]').exists()).toBe(true)
    leaflet.mapHandlers['click']!()
    await flushPromises()
    expect(wrapper.find('[data-test="selection-card"]').exists()).toBe(false)
  })

  it('filter chips reduce the rendered pins and rows', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    expect(wrapper.findAll('.nearrow')).toHaveLength(3)

    const etwasDaChip = wrapper
      .findAll('.filterchip')
      .find((c) => c.text() === 'Etwas da')!
    await etwasDaChip.trigger('click')
    await flushPromises()

    expect(pins()).toHaveLength(1)
    expect(pins()[0]!.options.icon?.html).toContain('#2f7d54')
    const rows = wrapper.findAll('.nearrow')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text()).toContain('Hirschgrün')
  })

  it('locating flies to the fix and shows the pulsing dot with accuracy circle', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 50.761, longitude: 6.099, accuracy: 40 },
      } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    const wrapper = mountKarte()
    await flushPromises()

    await wrapper.find('.locbtn').trigger('click')
    await flushPromises()

    expect(leaflet.mapObj.flyTo).toHaveBeenCalledWith([50.761, 6.099], 15, {
      animate: true,
    })
    const userDot = leaflet.markers.find((m) =>
      String(m.options.icon?.className).includes('userdot-wrap'),
    )
    expect(userDot).toBeTruthy()
    expect(userDot!.latlng).toEqual([50.761, 6.099])
    expect(userDot!.options.icon?.html).toContain('userdot-pulse')

    expect(leaflet.circles).toHaveLength(1)
    expect(leaflet.circles[0]!.options['radius']).toBe(40)

    // distance sorting still applies
    const rows = wrapper.findAll('.nearrow')
    expect(rows[0]!.text()).toContain('Pfannenzauber')
    expect(rows[0]!.text()).toMatch(/\d+ m|\d+,\d km/)
  })

  it('caps the visual accuracy radius', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 50.761, longitude: 6.099, accuracy: 5000 },
      } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    const wrapper = mountKarte()
    await flushPromises()
    await wrapper.find('.locbtn').trigger('click')
    await flushPromises()

    expect(leaflet.circles[0]!.options['radius']).toBe(200)
  })

  it('does not fly when the fix is far from the region, shows the far-away hint', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      // Berlin – way beyond 100km from Aachen
      success({
        coords: { latitude: 52.52, longitude: 13.405, accuracy: 30 },
      } as GeolocationPosition)
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition }, onLine: true })

    const wrapper = mountKarte()
    await flushPromises()
    await wrapper.find('.locbtn').trigger('click')
    await flushPromises()

    expect(leaflet.mapObj.flyTo).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(
      'Du scheinst weiter weg zu sein – Karte bleibt bei den Fairteilern.',
    )
    // dot still shown, distances still sorted
    expect(
      leaflet.markers.some((m) =>
        String(m.options.icon?.className).includes('userdot-wrap'),
      ),
    ).toBe(true)
  })

  it('renders basket markers distinctly, named and outside the initial bounds', async () => {
    mountKarte()
    await flushPromises()

    const baskets = basketPins()
    expect(baskets).toHaveLength(1)
    expect(baskets[0]!.latlng).toEqual([50.775, 6.095])
    expect(baskets[0]!.options.icon?.html).toContain('#8a6a3b')
    expect(baskets[0]!.options.icon?.className).not.toContain('pin-wrap')
    expect(baskets[0]!.element.getAttribute('aria-label')).toBe('Essenskorb')
    expect(baskets[0]!.element.getAttribute('role')).toBe('button')

    // initial bounds stay fairteiler-only (3 points, no basket coordinate)
    const bounds = leaflet.L.latLngBounds.mock.calls[0]![0] as [number, number][]
    expect(bounds).toHaveLength(3)
    expect(bounds.some((point) => point[0] === 50.775 && point[1] === 6.095)).toBe(false)
  })

  it('the Essenskörbe chip toggles basket markers only and persists', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    const chip = wrapper.findAll('.filterchip').find((c) => c.text() === 'Essenskörbe')!
    expect(chip.attributes('aria-pressed')).toBe('true') // default on

    await chip.trigger('click')
    await flushPromises()
    expect(basketPins()).toHaveLength(0)
    expect(pins()).toHaveLength(3) // fairteiler pins untouched
    expect(JSON.parse(localStorage.getItem('fairteiler-filter')!)).toMatchObject({
      baskets: false,
    })

    await chip.trigger('click')
    await flushPromises()
    expect(basketPins()).toHaveLength(1)
  })

  it('tapping a basket selects it: flyTo(15), card with external link only', async () => {
    const wrapper = mountKarte()
    await flushPromises()

    basketPins()[0]!.handlers['click']!()
    await flushPromises()

    expect(leaflet.mapObj.flyTo).toHaveBeenCalledWith([50.775, 6.095], 15, {
      animate: true,
    })

    const card = wrapper.find('[data-test="basket-card"]')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('Essenskorb in der Nähe')
    expect(card.text()).toContain('Privates Lebensmittel-Angebot')

    const link = card.find('a')
    expect(link.attributes('href')).toBe('https://foodsharing.de/essenskoerbe/7001')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    // no Route button, no Details route
    expect(card.find('.selroute').exists()).toBe(false)
    expect(card.find('[data-test="selection-details"]').exists()).toBe(false)
    // fresh data: no stale hint
    expect(card.find('[data-test="basket-stale"]').exists()).toBe(false)

    // selection announced, deselect via X restores the list
    expect(wrapper.find('[role="status"]').text()).toContain('Essenskorb in der Nähe')
    await wrapper.find('[data-test="deselect-basket"]').trigger('click')
    expect(wrapper.find('[data-test="basket-card"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Hirschgrün')
  })

  it('shows the muted Stand hint when the basket data is stale', async () => {
    basketsResponse = () =>
      Promise.resolve(
        jsonResponse({
          baskets: [{ id: 7001, lat: 50.775, lon: 6.095 }],
          fetchedAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
          stale: true,
        }),
      )
    mockFetch()

    const wrapper = mountKarte()
    await flushPromises()
    basketPins()[0]!.handlers['click']!()
    await flushPromises()

    expect(wrapper.find('[data-test="basket-stale"]').text()).toBe('Stand: vor 3 Std')
  })

  it('is silently absent when the basket fetch fails or is empty', async () => {
    basketsResponse = () => Promise.reject(new TypeError('Failed to fetch'))
    mockFetch()

    const wrapper = mountKarte()
    await flushPromises()

    expect(basketPins()).toHaveLength(0)
    expect(
      wrapper.findAll('.filterchip').some((c) => c.text() === 'Essenskörbe'),
    ).toBe(false)
    expect(pins()).toHaveLength(3) // map itself unaffected

    // empty list behaves the same
    basketsResponse = () =>
      Promise.resolve(jsonResponse({ baskets: [], fetchedAt: null, stale: false }))
    mockFetch()
    const empty = mountKarte()
    await flushPromises()
    expect(
      empty.findAll('.filterchip').some((c) => c.text() === 'Essenskörbe'),
    ).toBe(false)
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
      success({
        coords: { latitude: 50.76, longitude: 6.09, accuracy: 25 },
      } as GeolocationPosition)
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
    expect(leaflet.mapObj.flyTo).toHaveBeenCalledWith([50.76, 6.09], 15, {
      animate: true,
    })
  })
})
