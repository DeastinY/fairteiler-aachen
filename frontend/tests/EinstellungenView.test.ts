import { mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from '../src/composables/useToast'
import EinstellungenView from '../src/views/EinstellungenView.vue'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }
})

function mountSettings() {
  return mount(EinstellungenView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

beforeEach(() => localStorage.clear())

describe('EinstellungenView', () => {
  it('persists the auto-locate toggle', async () => {
    const wrapper = mountSettings()
    const toggle = wrapper.find('[data-test="auto-locate"]')
    expect(toggle.attributes('aria-checked')).toBe('false')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-checked')).toBe('true')
    expect(localStorage.getItem('fairteiler-auto-locate')).toBe('true')

    // a fresh mount restores the stored value
    const again = mountSettings()
    expect(again.find('[data-test="auto-locate"]').attributes('aria-checked')).toBe('true')
  })

  it('links to Aktivität for notification settings', () => {
    const wrapper = mountSettings()
    const targets = wrapper
      .findAllComponents(RouterLinkStub)
      .map((link) => link.props('to'))
    expect(targets).toContain('/aktivitaet')
  })

  it('clears local data only after the inline confirmation', async () => {
    localStorage.setItem('fairteiler-device-id', 'abc')
    localStorage.setItem('fairteiler-push-ids', '[810]')

    const wrapper = mountSettings()
    await wrapper.find('[data-test="clear-data"]').trigger('click')

    // first tap: nothing deleted yet, confirmation shown
    expect(localStorage.getItem('fairteiler-device-id')).toBe('abc')
    expect(wrapper.find('[data-test="clear-confirm-text"]').exists()).toBe(true)

    await wrapper.find('[data-test="clear-confirm"]').trigger('click')

    expect(localStorage.getItem('fairteiler-device-id')).toBeNull()
    expect(localStorage.getItem('fairteiler-push-ids')).toBeNull()
    const toast = useToast()
    expect(toast.visible).toBe(true)
    expect(toast.message).toBe('Lokale Daten gelöscht.')
  })

  it('can cancel the confirmation without deleting', async () => {
    localStorage.setItem('fairteiler-device-id', 'abc')

    const wrapper = mountSettings()
    await wrapper.find('[data-test="clear-data"]').trigger('click')
    await wrapper.find('[data-test="clear-cancel"]').trigger('click')

    expect(localStorage.getItem('fairteiler-device-id')).toBe('abc')
    expect(wrapper.find('[data-test="clear-data"]').exists()).toBe(true)
  })

  it('shows the app version and license line', () => {
    const wrapper = mountSettings()
    expect(wrapper.text()).toMatch(/v\d+\.\d+\.\d+/)
    expect(wrapper.text()).toContain('AGPL-3.0')
  })
})
