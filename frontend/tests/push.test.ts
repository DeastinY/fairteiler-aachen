import { afterEach, describe, expect, it } from 'vitest'
import { loadPushPrefs, savePushPrefs } from '../src/composables/pushPrefs'
import {
  buildSubscriptionPayload,
  parsePushPayload,
  pushAvailability,
  urlBase64ToUint8Array,
} from '../src/lib/push'

describe('urlBase64ToUint8Array', () => {
  it('decodes plain base64', () => {
    expect([...urlBase64ToUint8Array('AQAB')]).toEqual([1, 0, 1])
  })

  it('adds missing padding', () => {
    // 'SGVsbG8' is 'Hello' without padding
    expect([...urlBase64ToUint8Array('SGVsbG8')]).toEqual([72, 101, 108, 108, 111])
  })

  it('translates URL-safe characters', () => {
    // '-_' is base64url for '+/' -> 0xFB 0xFF prefix bits
    expect([...urlBase64ToUint8Array('--__')]).toEqual([...urlBase64ToUint8Array('++//')])
    expect([...urlBase64ToUint8Array('-_8')]).toEqual([251, 255])
  })
})

describe('buildSubscriptionPayload', () => {
  const goodJson = {
    endpoint: 'https://push.example/abc',
    expirationTime: null,
    keys: { p256dh: 'KEY', auth: 'AUTH' },
  }

  it('builds the PUT body with sorted, unique, positive ids', () => {
    const payload = buildSubscriptionPayload(goodJson, [1220, 810, 1220, -3, 2.5], true)
    expect(payload).toEqual({
      subscription: { endpoint: 'https://push.example/abc', keys: { p256dh: 'KEY', auth: 'AUTH' } },
      fairteilerIds: [810, 1220],
      quietHours: true,
    })
  })

  it('allows an empty id list (server-side unsubscribe)', () => {
    expect(buildSubscriptionPayload(goodJson, [], false)?.fairteilerIds).toEqual([])
  })

  it('rejects subscriptions without endpoint or keys', () => {
    expect(buildSubscriptionPayload({}, [810], false)).toBeNull()
    expect(buildSubscriptionPayload({ endpoint: 'https://x' }, [810], false)).toBeNull()
    expect(
      buildSubscriptionPayload({ endpoint: 'https://x', keys: { p256dh: 'K' } }, [810], false),
    ).toBeNull()
  })
})

describe('parsePushPayload', () => {
  it('parses a full payload', () => {
    const raw = JSON.stringify({
      title: 'Hirschgrün',
      body: 'Etwas gebracht: Brot',
      url: '/fairteiler/810',
      tag: 'fairteiler-810',
    })
    expect(parsePushPayload(raw)).toEqual({
      title: 'Hirschgrün',
      body: 'Etwas gebracht: Brot',
      url: '/fairteiler/810',
      tag: 'fairteiler-810',
    })
  })

  it('defaults body to empty and url to / when absent or external', () => {
    expect(parsePushPayload(JSON.stringify({ title: 'Hi' }))).toEqual({
      title: 'Hi',
      body: '',
      url: '/',
    })
    expect(
      parsePushPayload(JSON.stringify({ title: 'Hi', url: 'https://evil.example' }))?.url,
    ).toBe('/')
  })

  it('returns null for malformed input', () => {
    expect(parsePushPayload(null)).toBeNull()
    expect(parsePushPayload('')).toBeNull()
    expect(parsePushPayload('not json')).toBeNull()
    expect(parsePushPayload('42')).toBeNull()
    expect(parsePushPayload(JSON.stringify({ body: 'no title' }))).toBeNull()
  })
})

describe('pushAvailability', () => {
  const enabled = { enabled: true, vapidPublicKey: 'KEY' }

  it('is unsupported when the browser lacks push', () => {
    expect(pushAvailability(enabled, false)).toBe('unsupported')
  })

  it('is server_disabled without config, when disabled, or without key', () => {
    expect(pushAvailability(null, true)).toBe('server_disabled')
    expect(pushAvailability({ enabled: false, vapidPublicKey: 'K' }, true)).toBe('server_disabled')
    expect(pushAvailability({ enabled: true, vapidPublicKey: null }, true)).toBe('server_disabled')
  })

  it('is ready when browser and server support push', () => {
    expect(pushAvailability(enabled, true)).toBe('ready')
  })
})

describe('push prefs local mirror', () => {
  afterEach(() => localStorage.clear())

  it('round-trips ids and quiet hours', () => {
    savePushPrefs([810, 1220], true)
    expect(loadPushPrefs()).toEqual({ ids: [810, 1220], quietHours: true })
  })

  it('returns defaults for empty or corrupt storage', () => {
    expect(loadPushPrefs()).toEqual({ ids: [], quietHours: false })
    localStorage.setItem('fairteiler-push-ids', '{broken')
    expect(loadPushPrefs()).toEqual({ ids: [], quietHours: false })
  })
})
