import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InstallCard from '../src/components/InstallCard.vue'
import {
  _resetInstallPromptForTests,
  captureInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../src/composables/useInstallPrompt'

function fireBeforeInstallPrompt(
  outcome: 'accepted' | 'dismissed' = 'accepted',
  promptImpl?: () => Promise<void>,
) {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  const bip = event as BeforeInstallPromptEvent
  bip.prompt = vi.fn(promptImpl ?? (() => Promise.resolve()))
  Object.defineProperty(bip, 'userChoice', { value: Promise.resolve({ outcome }) })
  window.dispatchEvent(event)
  return bip
}

beforeEach(() => {
  localStorage.clear()
  _resetInstallPromptForTests()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  _resetInstallPromptForTests()
})

describe('InstallCard', () => {
  it('is hidden entirely when running standalone (installed)', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    captureInstallPrompt()
    fireBeforeInstallPrompt()
    const wrapper = mount(InstallCard)
    expect(wrapper.find('.installcard').exists()).toBe(false)
  })

  it('is hidden on browsers with neither prompt nor iOS instructions', () => {
    const wrapper = mount(InstallCard) // happy-dom UA is desktop-like
    expect(wrapper.find('.installcard').exists()).toBe(false)
  })

  it('shows the iOS instructions on iPhones without a prompt event', () => {
    vi.stubGlobal('navigator', {
      onLine: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
    })
    const wrapper = mount(InstallCard)
    expect(wrapper.find('.installcard').exists()).toBe(true)
    expect(wrapper.find('.installbtn').exists()).toBe(false)
    expect(wrapper.text()).toContain('Zum Home-Bildschirm')
  })

  it('shows the install button when the browser offered a prompt and forwards the tap', async () => {
    captureInstallPrompt()
    const event = fireBeforeInstallPrompt('accepted')

    const wrapper = mount(InstallCard)
    const button = wrapper.find('.installbtn')
    expect(button.exists()).toBe(true)

    await button.trigger('click')
    await flushPromises()
    expect(event.prompt).toHaveBeenCalledTimes(1)
  })

  it('disables the button while the prompt is open', async () => {
    captureInstallPrompt()
    let resolvePrompt!: () => void
    fireBeforeInstallPrompt('dismissed', () => new Promise((r) => (resolvePrompt = r)))

    const wrapper = mount(InstallCard)
    await wrapper.find('.installbtn').trigger('click')
    expect(wrapper.find('.installbtn').attributes('disabled')).toBeDefined()

    resolvePrompt()
    await flushPromises()
    expect(wrapper.find('.installbtn').attributes('disabled')).toBeUndefined()
  })
})
