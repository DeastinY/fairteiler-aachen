import { afterEach, describe, expect, it } from 'vitest'
import {
  clearLocalData,
  loadAutoLocate,
  loadListSort,
  saveAutoLocate,
  saveListSort,
} from '../src/composables/settings'

afterEach(() => localStorage.clear())

describe('settings persistence', () => {
  it('defaults auto-locate to off', () => {
    expect(loadAutoLocate()).toBe(false)
  })

  it('round-trips the auto-locate toggle', () => {
    saveAutoLocate(true)
    expect(loadAutoLocate()).toBe(true)
    saveAutoLocate(false)
    expect(loadAutoLocate()).toBe(false)
  })

  it('persists the list sort mode and rejects junk values', () => {
    expect(loadListSort()).toBe('activity')
    saveListSort('distance')
    expect(loadListSort()).toBe('distance')
    saveListSort('lastReported')
    expect(loadListSort()).toBe('lastReported')
    localStorage.setItem('fairteiler-list-sort', 'nonsense')
    expect(loadListSort()).toBe('activity')
  })

  it('clearLocalData wipes device id, prefs and mirrors', () => {
    localStorage.setItem('fairteiler-device-id', 'abc')
    localStorage.setItem('fairteiler-filter', '{"etwasDa":true}')
    localStorage.setItem('fairteiler-push-ids', '[810]')
    localStorage.setItem('fairteiler-auto-locate', 'true')

    expect(clearLocalData()).toBe(true)

    expect(localStorage.getItem('fairteiler-device-id')).toBeNull()
    expect(localStorage.getItem('fairteiler-filter')).toBeNull()
    expect(localStorage.getItem('fairteiler-push-ids')).toBeNull()
    expect(loadAutoLocate()).toBe(false)
  })
})
