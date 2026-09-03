import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AktivitaetView from '../src/views/AktivitaetView.vue'
import { jsonResponse, makeFairteiler } from './fixtures'

const fetchMock = vi.fn()

const LIST = [
  makeFairteiler({ id: 810, name: 'BreitSeite' }),
  makeFairteiler({ id: 1220, name: 'Villa Kunterbund' }),
]

const SUBSCRIPTION_JSON = {
  endpoint: 'https://push.example/sub',
  expirationTime: null,
  keys: { p256dh: 'P256', auth: 'AUTH' },
}

function mockBackend(pushConfig: unknown, stats?: unknown) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
    if (url === '/api/push/config') return Promise.resolve(jsonResponse(pushConfig))
    if (url === '/api/stats') {
      if (stats === undefined) return Promise.reject(new TypeError('Failed to fetch'))
      return Promise.resolve(jsonResponse(stats))
    }
    if (url === '/api/push/subscription' && init?.method === 'PUT') {
      return Promise.resolve(new Response(null, { status: 204 }))
    }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

interface PushEnv {
  permission?: NotificationPermission
  existingSubscription?: boolean
}

function stubPushEnvironment({ permission = 'granted', existingSubscription = false }: PushEnv = {}) {
  const subscription = { toJSON: () => SUBSCRIPTION_JSON }
  const subscribe = vi.fn().mockResolvedValue(subscription)
  const getSubscription = vi
    .fn()
    .mockResolvedValue(existingSubscription ? subscription : null)
  const requestPermission = vi.fn().mockResolvedValue(permission)

  vi.stubGlobal('navigator', {
    onLine: true,
    serviceWorker: { ready: Promise.resolve({ pushManager: { subscribe, getSubscription } }) },
  })
  vi.stubGlobal('PushManager', class {})
  vi.stubGlobal('Notification', { requestPermission })

  return { subscribe, getSubscription, requestPermission }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('AktivitaetView', () => {
  it('shows the weekly stats line from /api/stats', async () => {
    stubPushEnvironment()
    mockBackend(
      { enabled: false, vapidPublicKey: null },
      { fairteilerTotal: 11, withFood: 4, reports7d: 23 },
    )

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    const stats = wrapper.find('[data-test="stats"]')
    expect(stats.exists()).toBe(true)
    expect(stats.find('span').text().replace(/\s+/g, ' ')).toBe(
      'Diese Woche: 23 Meldungen · gerade 4 von 11 mit Essen',
    )
    // muted cross-link to the transparency page
    expect(stats.find('.statslink').text()).toBe('Mehr unter Statistik')
  })

  it('hides the stats line silently when the fetch fails', async () => {
    stubPushEnvironment()
    mockBackend({ enabled: false, vapidPublicKey: null }) // stats reject

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    expect(wrapper.find('[data-test="stats"]').exists()).toBe(false)
    // the rest of the page still renders
    expect(wrapper.text()).toContain('BreitSeite')
  })

  it('keeps the informational note when the server has push disabled', async () => {
    stubPushEnvironment()
    mockBackend({ enabled: false, vapidPublicKey: null })

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    expect(wrapper.find('[data-test="push-unavailable"]').text()).toContain(
      'Benachrichtigungen sind auf diesem Server (noch) nicht aktiviert.',
    )
    for (const toggle of wrapper.findAll('.switch')) {
      expect(toggle.attributes('disabled')).toBeDefined()
    }
  })

  it('shows the browser note when push is unsupported', async () => {
    // no PushManager / serviceWorker stubbed -> happy-dom navigator lacks both
    mockBackend({ enabled: true, vapidPublicKey: 'BKey' })

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    expect(wrapper.find('[data-test="push-unavailable"]').text()).toContain(
      'Dein Browser unterstützt keine Push-Benachrichtigungen.',
    )
  })

  it('subscribes on first enable and PUTs the full state', async () => {
    const env = stubPushEnvironment()
    mockBackend({ enabled: true, vapidPublicKey: 'BKey' })

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    expect(wrapper.find('[data-test="push-unavailable"]').exists()).toBe(false)

    const firstToggle = wrapper.findAll('.switch')[0]!
    await firstToggle.trigger('click')
    await flushPromises()

    expect(env.requestPermission).toHaveBeenCalled()
    expect(env.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    )

    const put = fetchMock.mock.calls.find(([url]) => url === '/api/push/subscription')!
    expect(put[1].method).toBe('PUT')
    expect(JSON.parse(put[1].body)).toEqual({
      subscription: {
        endpoint: 'https://push.example/sub',
        keys: { p256dh: 'P256', auth: 'AUTH' },
      },
      fairteilerIds: [810],
      quietHours: false,
    })
    expect(firstToggle.attributes('aria-checked')).toBe('true')
  })

  it('PUTs an empty id list when the last toggle is switched off', async () => {
    stubPushEnvironment({ existingSubscription: true })
    mockBackend({ enabled: true, vapidPublicKey: 'BKey' })
    localStorage.setItem('fairteiler-push-ids', JSON.stringify([810]))

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    const firstToggle = wrapper.findAll('.switch')[0]!
    expect(firstToggle.attributes('aria-checked')).toBe('true')

    await firstToggle.trigger('click')
    await flushPromises()

    const put = fetchMock.mock.calls.find(([url]) => url === '/api/push/subscription')!
    expect(JSON.parse(put[1].body).fairteilerIds).toEqual([])
    expect(firstToggle.attributes('aria-checked')).toBe('false')
  })

  it('includes quietHours in the PUT when its toggle changes', async () => {
    stubPushEnvironment({ existingSubscription: true })
    mockBackend({ enabled: true, vapidPublicKey: 'BKey' })
    localStorage.setItem('fairteiler-push-ids', JSON.stringify([1220]))

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    await wrapper.find('[data-test="quiet-toggle"]').trigger('click')
    await flushPromises()

    const put = fetchMock.mock.calls.find(([url]) => url === '/api/push/subscription')!
    expect(JSON.parse(put[1].body)).toMatchObject({
      fairteilerIds: [1220],
      quietHours: true,
    })
  })

  it('reverts the toggle and shows a German hint when permission is denied', async () => {
    const env = stubPushEnvironment({ permission: 'denied' })
    mockBackend({ enabled: true, vapidPublicKey: 'BKey' })

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    const firstToggle = wrapper.findAll('.switch')[0]!
    await firstToggle.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Benachrichtigungen sind im Browser blockiert',
    )
    expect(firstToggle.attributes('aria-checked')).toBe('false')
    expect(env.subscribe).not.toHaveBeenCalled()
    expect(
      fetchMock.mock.calls.some(([url]) => url === '/api/push/subscription'),
    ).toBe(false)
  })

  it('reverts and shows an error hint when the PUT fails', async () => {
    stubPushEnvironment()
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/fairteiler') return Promise.resolve(jsonResponse(LIST))
      if (url === '/api/push/config') {
        return Promise.resolve(jsonResponse({ enabled: true, vapidPublicKey: 'BKey' }))
      }
      if (init?.method === 'PUT') return Promise.reject(new TypeError('Failed to fetch'))
      throw new Error(`unexpected fetch: ${url}`)
    })

    const wrapper = mount(AktivitaetView)
    await flushPromises()

    const firstToggle = wrapper.findAll('.switch')[0]!
    await firstToggle.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Konnte nicht gespeichert werden')
    expect(firstToggle.attributes('aria-checked')).toBe('false')
  })
})
