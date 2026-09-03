/** Small persisted app settings (guarded localStorage). */
import { LIST_SORT_MODES, type ListSortMode } from '../lib/sort'

const AUTO_LOCATE_KEY = 'fairteiler-auto-locate'

/** Whether the Karte may ask for geolocation automatically when opened. */
export function loadAutoLocate(): boolean {
  try {
    return localStorage.getItem(AUTO_LOCATE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveAutoLocate(value: boolean): void {
  try {
    localStorage.setItem(AUTO_LOCATE_KEY, String(value))
  } catch {
    // storage unavailable – the manual button still works
  }
}

const LIST_SORT_KEY = 'fairteiler-list-sort'

/** Persisted sort choice for the Liste tab. */
export function loadListSort(): ListSortMode {
  try {
    const stored = localStorage.getItem(LIST_SORT_KEY)
    if (stored && (LIST_SORT_MODES as string[]).includes(stored)) {
      return stored as ListSortMode
    }
  } catch {
    // storage unavailable
  }
  return 'activity'
}

export function saveListSort(mode: ListSortMode): void {
  try {
    localStorage.setItem(LIST_SORT_KEY, mode)
  } catch {
    // storage unavailable
  }
}

/** Wipes everything this app stored in the browser. */
export function clearLocalData(): boolean {
  try {
    localStorage.clear()
    return true
  } catch {
    return false
  }
}
