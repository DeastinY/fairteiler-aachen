import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppToast from '../src/components/AppToast.vue'
import { hideToast, showToast, useToast } from '../src/composables/useToast'

beforeEach(() => {
  vi.useFakeTimers()
  hideToast()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToast timing', () => {
  it('hides a plain toast after ~2.2s', () => {
    showToast('Hallo')
    const toast = useToast()
    expect(toast.visible).toBe(true)

    vi.advanceTimersByTime(2100)
    expect(toast.visible).toBe(true)
    vi.advanceTimersByTime(200)
    expect(toast.visible).toBe(false)
  })

  it('keeps an action toast for ~6s and clears the action on timeout', () => {
    showToast('Gesendet', { action: { label: 'Rückgängig', handler: vi.fn() } })
    const toast = useToast()

    vi.advanceTimersByTime(5900)
    expect(toast.visible).toBe(true)
    expect(toast.action?.label).toBe('Rückgängig')

    vi.advanceTimersByTime(200)
    expect(toast.visible).toBe(false)
    expect(toast.action).toBeNull()
  })

  it('an overlapping showToast resets the timer and replaces the content', () => {
    showToast('Erste')
    vi.advanceTimersByTime(2000)
    showToast('Zweite', { green: true })
    const toast = useToast()

    // old timer must not hide the new toast 200ms later
    vi.advanceTimersByTime(400)
    expect(toast.visible).toBe(true)
    expect(toast.message).toBe('Zweite')
    expect(toast.green).toBe(true)

    vi.advanceTimersByTime(2000)
    expect(toast.visible).toBe(false)
  })

  it('hideToast hides immediately and cancels the pending timer', () => {
    showToast('Weg damit')
    hideToast()
    const toast = useToast()
    expect(toast.visible).toBe(false)
    expect(toast.action).toBeNull()
    vi.advanceTimersByTime(3000) // no stray timer effects
    expect(toast.visible).toBe(false)
  })
})

describe('AppToast action button', () => {
  it('renders the action, invokes the handler once and closes the toast', async () => {
    const handler = vi.fn()
    showToast('Mit Aktion', { action: { label: 'Rückgängig', handler } })

    const wrapper = mount(AppToast)
    const button = wrapper.find('.toastaction')
    expect(button.text()).toBe('Rückgängig')

    await button.trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(useToast().visible).toBe(false)
    expect(wrapper.find('.toastaction').exists()).toBe(false)
  })

  it('renders no action button for plain toasts', () => {
    showToast('Nur Text')
    const wrapper = mount(AppToast)
    expect(wrapper.find('.toastaction').exists()).toBe(false)
    expect(wrapper.text()).toContain('Nur Text')
  })
})
