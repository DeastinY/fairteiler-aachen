import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useToast } from '../src/composables/useToast'
import MeldenView from '../src/views/MeldenView.vue'
import { jsonResponse, makeFairteiler } from './fixtures'

const fetchMock = vi.fn()

const LIST = [
  makeFairteiler({ id: 810, name: 'BreitSeite' }),
  makeFairteiler({ id: 1220, name: 'Villa Kunterbund' }),
]

function makeTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/melden', component: MeldenView },
      { path: '/regeln', component: { template: '<div />' } },
      { path: '/fairteiler/:id', component: { template: '<div />' } },
    ],
  })
}

async function mountMelden(query = '?fairteiler=1220') {
  const router = makeTestRouter()
  await router.push(`/melden${query}`)
  await router.isReady()
  const wrapper = mount(MeldenView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockImplementation((url: string) => {
    if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
    throw new Error(`unexpected fetch: ${url}`)
  })
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('MeldenView', () => {
  it('preselects the fairteiler from the query param', async () => {
    const { wrapper } = await mountMelden('?fairteiler=1220')
    const select = wrapper.find('select').element as HTMLSelectElement
    expect(select.value).toBe('1220')
    expect(wrapper.text()).toContain('Kleinkölnstraße 18')
  })

  it('falls back to the first fairteiler without query param', async () => {
    const { wrapper } = await mountMelden('')
    const select = wrapper.find('select').element as HTMLSelectElement
    expect(select.value).toBe('810')
  })

  it('submits type and tags with the right payload and shows the success toast', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (url === '/api/fairteiler/1220/reports' && init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(
            { id: 55, type: 'brought', tags: ['obst'], createdAt: '2026-09-03T10:00:00+00:00' },
            201,
          ),
        )
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const { wrapper, router } = await mountMelden('?fairteiler=1220')

    // type "brought" is preselected; pick tags Obst + Gemüse, then unpick Gemüse
    const chips = wrapper.findAll('.foodchip')
    const obst = chips.find((c) => c.text() === 'Obst')!
    const gemuese = chips.find((c) => c.text() === 'Gemüse')!
    await obst.trigger('click')
    await gemuese.trigger('click')
    expect(obst.attributes('aria-pressed')).toBe('true')
    await gemuese.trigger('click')
    expect(gemuese.attributes('aria-pressed')).toBe('false')

    await wrapper.find('.sendbtn').trigger('click')
    await flushPromises()

    const post = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/reports'))!
    expect(post[0]).toBe('/api/fairteiler/1220/reports')
    expect(JSON.parse(post[1].body)).toEqual({ type: 'brought', tags: ['obst'] })
    expect(post[1].headers['X-Device-Id']).toBeTruthy()

    const toast = useToast()
    expect(toast.visible).toBe(true)
    expect(toast.green).toBe(true)
    expect(toast.message).toBe('Danke! Deine Meldung ist online.')
    expect(toast.action?.label).toBe('Rückgängig')

    expect(router.currentRoute.value.path).toBe('/fairteiler/1220')
  })

  it('undoes the report via the toast action', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(
            { id: 77, type: 'brought', tags: [], createdAt: '2026-09-03T10:00:00+00:00' },
            201,
          ),
        )
      }
      if (init?.method === 'DELETE') {
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const { wrapper } = await mountMelden('?fairteiler=810')
    await wrapper.find('.sendbtn').trigger('click')
    await flushPromises()

    const toast = useToast()
    expect(toast.action?.label).toBe('Rückgängig')
    toast.action!.handler()
    await flushPromises()

    const del = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')!
    expect(del[0]).toBe('/api/reports/77')
    expect(del[1].headers['X-Device-Id']).toBeTruthy()
    expect(toast.message).toBe('Meldung zurückgenommen.')
    // stored own-report entry is removed again
    expect(localStorage.getItem('fairteiler-own-reports')).toBe('[]')
  })

  it('surfaces the backend message when the undo is rejected', async () => {
    const detail = 'Nur eigene Meldungen können gelöscht werden.'
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(
            { id: 78, type: 'brought', tags: [], createdAt: '2026-09-03T10:00:00+00:00' },
            201,
          ),
        )
      }
      if (init?.method === 'DELETE') {
        return Promise.resolve(jsonResponse({ detail }, 403))
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const { wrapper } = await mountMelden('?fairteiler=810')
    await wrapper.find('.sendbtn').trigger('click')
    await flushPromises()

    useToast().action!.handler()
    await flushPromises()

    expect(useToast().message).toBe(detail)
  })

  it('submits a different report type when selected', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(
            { id: 56, type: 'empty', tags: [], createdAt: '2026-09-03T10:00:00+00:00' },
            201,
          ),
        )
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const { wrapper } = await mountMelden('?fairteiler=810')

    const emptyOption = wrapper
      .findAll('.actioncard')
      .find((c) => c.text().includes('Der Fairteiler ist leer'))!
    await emptyOption.trigger('click')
    expect(emptyOption.attributes('aria-checked')).toBe('true')

    await wrapper.find('.sendbtn').trigger('click')
    await flushPromises()

    const post = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/reports'))!
    expect(post[0]).toBe('/api/fairteiler/810/reports')
    expect(JSON.parse(post[1].body)).toEqual({ type: 'empty', tags: [] })
  })

  it('keeps all six options in one exclusive radio group and hides tags for conditions', async () => {
    const { wrapper } = await mountMelden('?fairteiler=810')

    // brought is preselected -> tags visible
    expect(wrapper.text()).toContain('Was ist jetzt da?')

    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(6)

    const needsCleaning = radios.find((r) => r.text().includes('Reinigung nötig'))!
    await needsCleaning.trigger('click')

    expect(needsCleaning.attributes('aria-checked')).toBe('true')
    const checked = radios.filter((r) => r.attributes('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    // food action deselected, tags block gone
    const brought = radios.find((r) => r.text().includes('Ich habe etwas gebracht'))!
    expect(brought.attributes('aria-checked')).toBe('false')
    expect(wrapper.text()).not.toContain('Was ist jetzt da?')

    // selecting a food action deselects the condition again
    await brought.trigger('click')
    expect(brought.attributes('aria-checked')).toBe('true')
    expect(needsCleaning.attributes('aria-checked')).toBe('false')
    expect(wrapper.text()).toContain('Was ist jetzt da?')
  })

  it('submits a condition report with an empty tag list', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(
            {
              id: 90,
              type: 'needs_maintenance',
              tags: [],
              createdAt: '2026-09-03T10:00:00+00:00',
            },
            201,
          ),
        )
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const { wrapper } = await mountMelden('?fairteiler=810')

    // pick tags first, then switch to a condition – tags must not leak
    await wrapper.findAll('.foodchip')[0]!.trigger('click')
    const defect = wrapper
      .findAll('[role="radio"]')
      .find((r) => r.text().includes('Etwas ist defekt'))!
    await defect.trigger('click')
    await wrapper.find('.sendbtn').trigger('click')
    await flushPromises()

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(JSON.parse(post[1].body)).toEqual({ type: 'needs_maintenance', tags: [] })
  })

  it('links to the Regeln page near the tags', async () => {
    const { wrapper } = await mountMelden('?fairteiler=810')
    const link = wrapper.find('[data-test="regeln-link"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Was darf in den Fairteiler?')
  })

  it('shows the backend detail message on 429', async () => {
    const detail =
      'Für diesen Fairteiler hast du gerade schon gemeldet – bitte warte ein paar Minuten (10 Min Abstand).'
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (init?.method === 'POST') return Promise.resolve(jsonResponse({ detail }, 429))
      throw new Error(`unexpected fetch: ${url}`)
    })

    const { wrapper, router } = await mountMelden('?fairteiler=810')
    await wrapper.find('.sendbtn').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe(detail)
    expect(router.currentRoute.value.path).toBe('/melden')
  })

  it('shows a German network error message when the POST fails', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (init?.method === 'POST') return Promise.reject(new TypeError('Failed to fetch'))
      throw new Error(`unexpected fetch: ${url}`)
    })

    const { wrapper } = await mountMelden('?fairteiler=810')
    await wrapper.find('.sendbtn').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'Keine Verbindung – bitte versuch es gleich noch einmal.',
    )
  })
})
