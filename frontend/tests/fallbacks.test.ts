import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prefersReducedMotion } from '../src/composables/useReducedMotion'
import { detectLocale, setLocale, SUPPORTED_LOCALES, t, _resetI18nForTests } from '../src/i18n'
import { reportTypeLabel, tagLabel, tagLabels } from '../src/lib/labels'

beforeEach(() => {
  localStorage.clear()
  _resetI18nForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  _resetI18nForTests()
})

describe('device id fallbacks', () => {
  async function freshDevice() {
    vi.resetModules()
    return (await import('../src/composables/device')).getDeviceId
  }

  it('falls back to a stable in-memory id when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const getDeviceId = await freshDevice()
    const first = getDeviceId()
    expect(first.length).toBeGreaterThanOrEqual(4)
    expect(getDeviceId()).toBe(first) // stable within the session
  })

  it('generates an id without crypto.randomUUID', async () => {
    vi.stubGlobal('crypto', {})
    const getDeviceId = await freshDevice()
    const id = getDeviceId()
    expect(id).toMatch(/^dev-/)
    expect(id.length).toBeGreaterThanOrEqual(4)
  })
})

describe('prefersReducedMotion fallbacks', () => {
  it('is false when matchMedia is missing or throws', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)

    vi.stubGlobal('matchMedia', () => {
      throw new Error('nope')
    })
    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('i18n edge paths', () => {
  it('detectLocale skips unsupported and malformed entries', () => {
    expect(detectLocale(['zz', 'xx-YY', ''])).toBe('de')
    expect(detectLocale(['pt-BR', 'AR'])).toBe('ar') // case-insensitive base match
  })

  it('setLocale still switches when persisting the choice fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    await setLocale('en')
    expect(t('nav.karte')).toBe('Map')
  })

  it('every supported locale catalog loads and translates', async () => {
    for (const { code } of SUPPORTED_LOCALES) {
      await setLocale(code)
      const title = t('liste.title')
      expect(title.length, code).toBeGreaterThan(0)
      expect(title, code).toContain('Fairteiler')
    }
  })
})

describe('label fallbacks', () => {
  it('unknown tags and report types pass through untranslated', () => {
    expect(tagLabel('kaviar')).toBe('kaviar')
    expect(tagLabels(['obst', 'kaviar'])).toBe('Obst, kaviar')
    expect(reportTypeLabel('exploded')).toBe('exploded')
  })
})
