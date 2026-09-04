/** Local mirror of the push toggles – only used to restore the UI. */

const IDS_KEY = 'fairteiler-push-ids'
const QUIET_KEY = 'fairteiler-push-quiet'
const BASKETS_KEY = 'fairteiler-push-baskets'

export interface PushPrefs {
  ids: number[]
  quietHours: boolean
  baskets: boolean
}

export function loadPushPrefs(): PushPrefs {
  try {
    const rawIds = localStorage.getItem(IDS_KEY)
    const ids: unknown = rawIds ? JSON.parse(rawIds) : []
    return {
      ids: Array.isArray(ids) ? ids.filter((id) => Number.isInteger(id)) : [],
      quietHours: localStorage.getItem(QUIET_KEY) === 'true',
      baskets: localStorage.getItem(BASKETS_KEY) === 'true',
    }
  } catch {
    return { ids: [], quietHours: false, baskets: false }
  }
}

export function savePushPrefs(
  ids: number[],
  quietHours: boolean,
  baskets = false,
): void {
  try {
    localStorage.setItem(IDS_KEY, JSON.stringify(ids))
    localStorage.setItem(QUIET_KEY, String(quietHours))
    localStorage.setItem(BASKETS_KEY, String(baskets))
  } catch {
    // storage unavailable – the server state still holds
  }
}
