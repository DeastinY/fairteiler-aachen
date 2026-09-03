import { computed, ref, type ComputedRef, type Ref } from 'vue'
import de from './de'

/**
 * Hand-rolled i18n, no runtime dependency.
 * - de is the statically bundled source of truth and the fallback.
 * - Every other locale is lazy-loaded on first use (dynamic import).
 * - {name} interpolation; plural variants are separate keys.
 */

export type MessageKey = keyof typeof de
export type Messages = Record<MessageKey, string>

export const SUPPORTED_LOCALES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'fr', name: 'Français' },
] as const

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code']

const STORAGE_KEY = 'fairteiler-locale'

const LOADERS: Record<Exclude<LocaleCode, 'de'>, () => Promise<{ default: Messages }>> = {
  en: () => import('./en'),
  tr: () => import('./tr'),
  ar: () => import('./ar'),
  ru: () => import('./ru'),
  pl: () => import('./pl'),
  uk: () => import('./uk'),
  nl: () => import('./nl'),
  fr: () => import('./fr'),
}

const catalogs: Partial<Record<LocaleCode, Messages>> = { de }

const locale: Ref<LocaleCode> = ref('de')

function isSupported(code: string): code is LocaleCode {
  return SUPPORTED_LOCALES.some((entry) => entry.code === code)
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/** Translate a key in the active locale, falling back to German. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const catalog = catalogs[locale.value]
  const template = catalog?.[key] ?? de[key] ?? key
  return interpolate(template, params)
}

function applyDocumentAttrs(code: LocaleCode): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = code
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
}

/** Switch the UI language; loads the catalog first so there is no flash. */
export async function setLocale(code: LocaleCode): Promise<void> {
  if (!catalogs[code] && code !== 'de') {
    try {
      catalogs[code] = (await LOADERS[code]()).default
    } catch {
      return // catalog unreachable (offline first visit) – keep current locale
    }
  }
  locale.value = code
  applyDocumentAttrs(code)
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // storage unavailable – the choice just won't survive a reload
  }
}

/** Best match of the browser languages against our supported set. */
export function detectLocale(navigatorLanguages: readonly string[]): LocaleCode {
  for (const entry of navigatorLanguages) {
    const base = entry.toLowerCase().split('-')[0] ?? ''
    if (isSupported(base)) return base
  }
  return 'de'
}

/** Called once from main.ts: stored choice first, else browser language. */
export async function initI18n(): Promise<void> {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  const code =
    stored && isSupported(stored)
      ? stored
      : detectLocale(typeof navigator !== 'undefined' ? (navigator.languages ?? []) : [])
  applyDocumentAttrs('de') // sane baseline even if the catalog load fails
  await setLocale(code)
}

export interface I18n {
  t: typeof t
  locale: ComputedRef<LocaleCode>
  setLocale: typeof setLocale
  locales: typeof SUPPORTED_LOCALES
}

export function useI18n(): I18n {
  return {
    t,
    locale: computed(() => locale.value),
    setLocale,
    locales: SUPPORTED_LOCALES,
  }
}

/** Test hook: back to a pristine German state. */
export function _resetI18nForTests(): void {
  locale.value = 'de'
  applyDocumentAttrs('de')
}
