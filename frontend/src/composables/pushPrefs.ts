/** Local mirror of the push toggles – only used to restore the UI. */

const IDS_KEY = 'fairteiler-push-ids'
const QUIET_KEY = 'fairteiler-push-quiet'

export interface PushPrefs {
  ids: number[]
  quietHours: boolean
}

export function loadPushPrefs(): PushPrefs {
  try {
    const rawIds = localStorage.getItem(IDS_KEY)
    const ids: unknown = rawIds ? JSON.parse(rawIds) : []
    return {
      ids: Array.isArray(ids) ? ids.filter((id) => Number.isInteger(id)) : [],
      quietHours: localStorage.getItem(QUIET_KEY) === 'true',
    }
  } catch {
    return { ids: [], quietHours: false }
  }
}

export function savePushPrefs(ids: number[], quietHours: boolean): void {
  try {
    localStorage.setItem(IDS_KEY, JSON.stringify(ids))
    localStorage.setItem(QUIET_KEY, String(quietHours))
  } catch {
    // storage unavailable – the server state still holds
  }
}
