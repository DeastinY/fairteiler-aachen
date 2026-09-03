import { afterEach, describe, expect, it } from 'vitest'
import {
  clearLocalData,
  loadAutoLocate,
  saveAutoLocate,
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
