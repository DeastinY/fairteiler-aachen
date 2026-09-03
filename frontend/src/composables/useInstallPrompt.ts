import { computed, ref, type ComputedRef } from 'vue'

/**
 * PWA install prompt handling.
 * - Chromium fires `beforeinstallprompt`; we stash it and offer a button.
 * - iOS Safari never fires it; we show manual instructions instead.
 * - Installed (standalone) → the whole feature stays hidden.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallMode = 'hidden' | 'promptable' | 'ios' | 'none'

/** Pure decision logic – unit-tested. */
export function installMode(
  standalone: boolean,
  ios: boolean,
  hasPromptEvent: boolean,
): InstallMode {
  if (standalone) return 'hidden'
  if (hasPromptEvent) return 'promptable'
  if (ios) return 'ios'
  return 'none'
}

export function isStandalone(): boolean {
  try {
    if (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) {
      return true
    }
  } catch {
    // matchMedia unavailable
  }
  return (
    typeof navigator !== 'undefined' &&
    (navigator as { standalone?: boolean }).standalone === true
  )
}

export function isIos(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  return /iPhone|iPad|iPod/.test(ua)
}

const promptEvent = ref<BeforeInstallPromptEvent | null>(null)
let listening = false

/** Must run early so the stashed event exists when the UI needs it. */
export function captureInstallPrompt(): void {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    promptEvent.value = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    promptEvent.value = null
  })
}

export interface InstallPrompt {
  mode: ComputedRef<InstallMode>
  canPrompt: ComputedRef<boolean>
  prompt: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

export function useInstallPrompt(): InstallPrompt {
  captureInstallPrompt()
  const mode = computed(() =>
    installMode(isStandalone(), isIos(), promptEvent.value !== null),
  )
  const canPrompt = computed(() => mode.value === 'promptable')

  async function prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    const event = promptEvent.value
    if (!event) return 'unavailable'
    await event.prompt()
    const choice = await event.userChoice
    if (choice.outcome === 'accepted') promptEvent.value = null
    return choice.outcome
  }

  return { mode, canPrompt, prompt }
}

/** Test hook: reset the stashed event and listener registration. */
export function _resetInstallPromptForTests(): void {
  promptEvent.value = null
  listening = false
}
