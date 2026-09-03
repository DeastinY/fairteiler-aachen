import { describe, expect, it } from 'vitest'
import { navigationUrl } from '../src/lib/navigation'

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15'
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
const DESKTOP_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

describe('navigationUrl', () => {
  it('uses Apple Maps on iOS devices', () => {
    expect(navigationUrl(50.7766, 6.0834, 'Fairteiler "BreitSeite"', IOS_UA)).toBe(
      'https://maps.apple.com/?daddr=50.7766,6.0834&q=Fairteiler%20%22BreitSeite%22',
    )
    expect(navigationUrl(50.7766, 6.0834, 'X', IPAD_UA)).toContain('maps.apple.com')
  })

  it('uses a geo: URI on Android', () => {
    expect(navigationUrl(50.7766, 6.0834, 'Hirschgrün', ANDROID_UA)).toBe(
      'geo:50.7766,6.0834?q=50.7766,6.0834(Hirschgr%C3%BCn)',
    )
  })

  it('falls back to OpenStreetMap directions elsewhere', () => {
    expect(navigationUrl(50.7766, 6.0834, 'Egal', DESKTOP_UA)).toBe(
      'https://www.openstreetmap.org/directions?to=50.7766%2C6.0834',
    )
  })
})
