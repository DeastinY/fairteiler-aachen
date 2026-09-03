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
            { type: 'brought', tags: ['obst'], createdAt: '2026-09-03T10:00:00+00:00' },
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

    expect(router.currentRoute.value.path).toBe('/fairteiler/1220')
  })

  it('submits a different report type when selected', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (init?.method === 'POST') {
        return Promise.resolve(
          jsonResponse({ type: 'empty', tags: [], createdAt: '2026-09-03T10:00:00+00:00' }, 201),
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
