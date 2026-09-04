/** Subscribing to push, shared by the Aktivität screen and the post-report
 * nudge. Keeps the permission dance, the service-worker wait and the PUT in
 * one place so both entry points behave identically. */
import { fetchPushConfig, putPushSubscription } from './api'
import { loadPushPrefs, savePushPrefs } from './pushPrefs'
import { buildSubscriptionPayload, isPushSupported, urlBase64ToUint8Array } from '../lib/push'

export type SubscribeResult = 'ok' | 'unavailable' | 'denied' | 'failed'

const NUDGE_KEY = 'fairteiler-nudge-shown'

/** The nudge is offered once per browser, and never when push can't work. */
export function nudgeAlreadyShown(): boolean {
  try {
    return localStorage.getItem(NUDGE_KEY) === 'true'
  } catch {
    return true
  }
}

export function markNudgeShown(): void {
  try {
    localStorage.setItem(NUDGE_KEY, 'true')
  } catch {
    // storage unavailable – the nudge simply may appear again
  }
}

export async function pushIsOffered(): Promise<boolean> {
  if (!isPushSupported()) return false
  const config = await fetchPushConfig().catch(() => null)
  return Boolean(config?.enabled && config.vapidPublicKey)
}

/** Adds one Fairteiler to the existing subscription (or creates it). */
export async function subscribeToFairteiler(id: number): Promise<SubscribeResult> {
  if (!isPushSupported()) return 'unavailable'
  const config = await fetchPushConfig().catch(() => null)
  const key = config?.vapidPublicKey
  if (!config?.enabled || !key) return 'unavailable'

  if ((await Notification.requestPermission()) !== 'granted') return 'denied'

  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ])
  if (!registration) return 'failed'

  try {
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
      })
    }
    const prefs = loadPushPrefs()
    const ids = [...new Set([...prefs.ids, id])]
    const payload = buildSubscriptionPayload(
      subscription.toJSON(),
      ids,
      prefs.quietHours,
      prefs.baskets,
      prefs.emptyAlerts,
    )
    if (!payload) return 'failed'
    await putPushSubscription(payload)
    savePushPrefs(ids, prefs.quietHours, prefs.baskets, prefs.emptyAlerts)
    return 'ok'
  } catch {
    return 'failed'
  }
}
