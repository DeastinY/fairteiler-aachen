import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import BottomNav from '../src/components/BottomNav.vue'
import { tagLabels } from '../src/lib/labels'
import {
  _resetI18nForTests,
  detectLocale,
  initI18n,
  SUPPORTED_LOCALES,
  setLocale,
  t,
} from '../src/i18n'
import de from '../src/i18n/de'

import ar from '../src/i18n/ar'
import en from '../src/i18n/en'
import fr from '../src/i18n/fr'
import nl from '../src/i18n/nl'
import pl from '../src/i18n/pl'
import ru from '../src/i18n/ru'
import tr from '../src/i18n/tr'
import uk from '../src/i18n/uk'

import { vi } from 'vitest'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRoute: () => ({ path: '/' }),
    useRouter: () => ({ push: vi.fn() }),
  }
})

const CATALOGS = { en, tr, ar, ru, pl, uk, nl, fr }

beforeEach(() => {
  localStorage.clear()
  _resetI18nForTests()
})

afterEach(() => {
  _resetI18nForTests()
})

describe('catalog completeness', () => {
  const deKeys = Object.keys(de).sort()

  for (const [code, catalog] of Object.entries(CATALOGS)) {
    it(`${code} has exactly the same keys as de`, () => {
      const keys = Object.keys(catalog).sort()
      const missing = deKeys.filter((k) => !keys.includes(k))
      const extra = keys.filter((k) => !deKeys.includes(k))
      expect(missing, `missing in ${code}`).toEqual([])
      expect(extra, `extra in ${code}`).toEqual([])
    })

    it(`${code} keeps "Fairteiler" untranslated and params intact`, () => {
      // proper noun present where German uses it in core labels
      expect((catalog as Record<string, string>)['liste.title']).toContain('Fairteiler')
      // interpolation params survive translation
      for (const key of ['time.minutes', 'karte.summary', 'einstellungen.version'] as const) {
        const params = [...de[key].matchAll(/\{(\w+)\}/g)].map((m) => m[1])
        for (const param of params) {
          expect(
            (catalog as Record<string, string>)[key],
            `${code} ${key} lost {${param}}`,
          ).toContain(`{${param}}`)
        }
      }
    })
  }
})

describe('t()', () => {
  it('interpolates params', () => {
    expect(t('time.minutes', { n: 18 })).toBe('vor 18 Min')
    expect(t('karte.summary', { reported: 4, total: 11 })).toBe(
      '4 von 11 mit aktueller Meldung',
    )
  })

  it('translates after setLocale and falls back to de for missing keys', async () => {
    await setLocale('en')
    expect(t('nav.karte')).toBe('Map')
    // simulate a missing key by deleting it from the loaded catalog copy
    const enCatalog = en as Record<string, string>
    const original = enCatalog['nav.liste']!
    delete enCatalog['nav.liste']
    try {
      expect(t('nav.liste')).toBe('Liste') // de fallback
    } finally {
      enCatalog['nav.liste'] = original
    }
  })

  it('persists the chosen locale', async () => {
    await setLocale('tr')
    expect(localStorage.getItem('fairteiler-locale')).toBe('tr')
    _resetI18nForTests()
    await initI18n()
    expect(t('nav.karte')).toBe('Harita')
  })

  it('sets document lang and dir (ar is RTL)', async () => {
    await setLocale('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    await setLocale('de')
    expect(document.documentElement.lang).toBe('de')
    expect(document.documentElement.dir).toBe('ltr')
  })
})

describe('detectLocale', () => {
  it('matches browser languages against the supported set', () => {
    expect(detectLocale(['en-US', 'en'])).toBe('en')
    expect(detectLocale(['tr-TR'])).toBe('tr')
    expect(detectLocale(['pt-BR', 'uk'])).toBe('uk')
    expect(detectLocale(['pt-BR', 'es'])).toBe('de')
    expect(detectLocale([])).toBe('de')
  })

  it('lists all nine locales with native names', () => {
    expect(SUPPORTED_LOCALES.map((entry) => entry.code)).toEqual([
      'de', 'en', 'tr', 'ar', 'ru', 'pl', 'uk', 'nl', 'fr',
    ])
    expect(SUPPORTED_LOCALES.map((entry) => entry.name)).toEqual([
      'Deutsch', 'English', 'Türkçe', 'العربية', 'Русский',
      'Polski', 'Українська', 'Nederlands', 'Français',
    ])
  })
})

describe('locale-aware list separator', () => {
  it('joins tag labels with the Arabic comma in ar and a plain comma in de', async () => {
    expect(tagLabels(['obst', 'gemuese'])).toBe('Obst, Gemüse')
    await setLocale('ar')
    expect(tagLabels(['obst', 'gemuese'])).toBe('فواكه، خضار')
  })
})

describe('a real view renders translated strings', () => {
  it('BottomNav switches between de, en and tr', async () => {
    const wrapper = mount(BottomNav, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    expect(wrapper.text()).toContain('Karte')
    expect(wrapper.text()).toContain('Aktivität')

    await setLocale('en')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Map')
    expect(wrapper.text()).toContain('Activity')

    await setLocale('tr')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Harita')
    expect(wrapper.text()).toContain('Etkinlik')
  })
})
