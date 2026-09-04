/** Pure helpers for Web Push – unit-tested, shared by the app and the SW. */

export interface PushConfig {
  enabled: boolean
  vapidPublicKey: string | null
}

export interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
}

export interface PushSubscriptionPayload {
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  fairteilerIds: number[]
  quietHours: boolean
  baskets: boolean
  emptyAlerts: boolean
}

/** Decodes a URL-safe base64 VAPID key into the bytes PushManager expects. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

/**
 * Builds the PUT /api/push/subscription body from a PushSubscription's JSON.
 * Returns null when the subscription is incomplete (no endpoint/keys).
 */
export function buildSubscriptionPayload(
  subscriptionJson: PushSubscriptionJSON | Record<string, unknown>,
  fairteilerIds: number[],
  quietHours: boolean,
  baskets = false,
  emptyAlerts = false,
): PushSubscriptionPayload | null {
  const endpoint = (subscriptionJson as PushSubscriptionJSON).endpoint
  const keys = (subscriptionJson as PushSubscriptionJSON).keys
  if (typeof endpoint !== 'string' || endpoint.length === 0) return null
  const p256dh = keys?.['p256dh']
  const auth = keys?.['auth']
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !p256dh || !auth) {
    return null
  }
  const ids = [...new Set(fairteilerIds)]
    .filter((id) => Number.isInteger(id) && id > 0)
    .sort((a, b) => a - b)
  return {
    subscription: { endpoint, keys: { p256dh, auth } },
    fairteilerIds: ids,
    quietHours,
    baskets,
    emptyAlerts,
  }
}

/**
 * Parses the JSON a push event carries. Returns null for anything malformed
 * so the SW simply shows nothing instead of crashing.
 */
export function parsePushPayload(raw: string | null | undefined): PushPayload | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const title = record['title']
  if (typeof title !== 'string' || title.length === 0) return null
  const body = typeof record['body'] === 'string' ? (record['body'] as string) : ''
  const rawUrl = record['url']
  const url = typeof rawUrl === 'string' && rawUrl.startsWith('/') ? rawUrl : '/'
  const tag = typeof record['tag'] === 'string' ? (record['tag'] as string) : undefined
  return tag === undefined ? { title, body, url } : { title, body, url, tag }
}

export type PushAvailability = 'ready' | 'server_disabled' | 'unsupported'

/** UI state: push controls are only live when browser AND server support it. */
export function pushAvailability(
  config: PushConfig | null,
  browserSupported: boolean,
): PushAvailability {
  if (!browserSupported) return 'unsupported'
  if (!config || !config.enabled || !config.vapidPublicKey) return 'server_disabled'
  return 'ready'
}

/** Feature detection for Web Push in the current browser. */
export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in globalThis &&
    'Notification' in globalThis
  )
}
