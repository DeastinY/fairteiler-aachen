/** Theme preference: follow the system, or force light/dark. */
import { ref } from 'vue'

export type ThemeChoice = 'system' | 'light' | 'dark'

const KEY = 'fairteiler-theme'
const THEME_COLORS: Record<'light' | 'dark', string> = {
  light: '#f4f1e9',
  dark: '#14170f',
}

export const theme = ref<ThemeChoice>('system')

function systemPrefersDark(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

/** Pure: what the document attribute should be for a given choice. */
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): 'light' | 'dark' {
  if (choice === 'system') return prefersDark ? 'dark' : 'light'
  return choice
}

function apply(choice: ThemeChoice): void {
  const effective = resolveTheme(choice, systemPrefersDark())
  const root = document.documentElement
  if (choice === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', choice)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[effective])
}

export function initTheme(): void {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(KEY)
  } catch {
    // storage unavailable – system it is
  }
  theme.value = stored === 'light' || stored === 'dark' ? stored : 'system'
  apply(theme.value)
  // keep the meta colour in sync when the OS flips while we follow it
  try {
    matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener?.('change', () => {
      if (theme.value === 'system') apply('system')
    })
  } catch {
    // no matchMedia – nothing to listen to
  }
}

export function setTheme(choice: ThemeChoice): void {
  theme.value = choice
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    // storage unavailable – applies for this session
  }
  apply(choice)
}
