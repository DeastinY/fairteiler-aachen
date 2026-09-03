import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  _resetInstallPromptForTests,
  captureInstallPrompt,
  installMode,
  isIos,
  isStandalone,
  useInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../src/composables/useInstallPrompt'

beforeEach(() => {
  localStorage.clear()
  _resetInstallPromptForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('installMode', () => {
  it('is hidden entirely when already installed (standalone)', () => {
    expect(installMode(true, false, false)).toBe('hidden')
    expect(installMode(true, true, true)).toBe('hidden')
  })

  it('is promptable when the browser offered beforeinstallprompt', () => {
    expect(installMode(false, false, true)).toBe('promptable')
  })

  it('is ios (instructions) on iOS without a prompt event', () => {
    expect(installMode(false, true, false)).toBe('ios')
  })

  it('is none on other browsers without a prompt event', () => {
    expect(installMode(false, false, false)).toBe('none')
  })
})

describe('platform detection', () => {
  it('detects iOS by user agent', () => {
    expect(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)')).toBe(true)
    expect(isIos('Mozilla/5.0 (iPad; CPU OS 17_5)')).toBe(true)
    expect(isIos('Mozilla/5.0 (Linux; Android 14)')).toBe(false)
  })

  it('detects standalone via matchMedia', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(isStandalone()).toBe(true)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isStandalone()).toBe(false)
  })
})

describe('useInstallPrompt capture flow', () => {
  function fireBeforeInstallPrompt(outcome: 'accepted' | 'dismissed') {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    const bip = event as BeforeInstallPromptEvent
    bip.prompt = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(bip, 'userChoice', {
      value: Promise.resolve({ outcome }),
    })
    window.dispatchEvent(event)
    return bip
  }

  it('stashes the event and prompts with the reported outcome', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    captureInstallPrompt()
    const { mode, canPrompt, prompt } = useInstallPrompt()

    expect(canPrompt.value).toBe(false)

    const event = fireBeforeInstallPrompt('accepted')
    expect(event.defaultPrevented).toBe(true)
    expect(mode.value).toBe('promptable')
    expect(canPrompt.value).toBe(true)

    await expect(prompt()).resolves.toBe('accepted')
    expect(event.prompt).toHaveBeenCalled()
    // accepted -> stashed event cleared, feature no longer promptable
    expect(canPrompt.value).toBe(false)
  })

  it('keeps the stashed event when the user dismisses the dialog', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    captureInstallPrompt()
    const { canPrompt, prompt } = useInstallPrompt()

    fireBeforeInstallPrompt('dismissed')
    await expect(prompt()).resolves.toBe('dismissed')
    expect(canPrompt.value).toBe(true)
  })

  it('reports unavailable without a stashed event', async () => {
    const { prompt } = useInstallPrompt()
    await expect(prompt()).resolves.toBe('unavailable')
  })
})
