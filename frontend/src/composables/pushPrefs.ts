/** Local mirror of the push toggles – only used to restore the UI. */

const IDS_KEY = 'fairteiler-push-ids'
const QUIET_KEY = 'fairteiler-push-quiet'
const BASKETS_KEY = 'fairteiler-push-baskets'
const EMPTY_KEY = 'fairteiler-push-empty'

export interface PushPrefs {
  ids: number[]
  quietHours: boolean
  baskets: boolean
  emptyAlerts: boolean
}

export function loadPushPrefs(): PushPrefs {
  try {
    const rawIds = localStorage.getItem(IDS_KEY)
    const ids: unknown = rawIds ? JSON.parse(rawIds) : []
    return {
      ids: Array.isArray(ids) ? ids.filter((id) => Number.isInteger(id)) : [],
      quietHours: localStorage.getItem(QUIET_KEY) === 'true',
      baskets: localStorage.getItem(BASKETS_KEY) === 'true',
      emptyAlerts: localStorage.getItem(EMPTY_KEY) === 'true',
    }
  } catch {
    return { ids: [], quietHours: false, baskets: false, emptyAlerts: false }
  }
}

export function savePushPrefs(
  ids: number[],
  quietHours: boolean,
  baskets = false,
  emptyAlerts = false,
): void {
  try {
    localStorage.setItem(IDS_KEY, JSON.stringify(ids))
    localStorage.setItem(QUIET_KEY, String(quietHours))
    localStorage.setItem(BASKETS_KEY, String(baskets))
    localStorage.setItem(EMPTY_KEY, String(emptyAlerts))
  } catch {
    // storage unavailable – the server state still holds
  }
}
