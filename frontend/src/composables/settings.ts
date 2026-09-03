/** Small persisted app settings (guarded localStorage). */

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

/** Wipes everything this app stored in the browser. */
export function clearLocalData(): boolean {
  try {
    localStorage.clear()
    return true
  } catch {
    return false
  }
}
