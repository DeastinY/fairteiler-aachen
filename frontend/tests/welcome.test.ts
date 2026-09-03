import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../src/App.vue'
import WelcomeOverlay from '../src/components/WelcomeOverlay.vue'
import {
  isDeepLinkEntry,
  isWelcomeDone,
  markWelcomeDone,
  shouldShowWelcome,
  welcomeVisible,
} from '../src/composables/welcome'

const routerPush = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: routerPush }) }
})

beforeEach(() => {
  localStorage.clear()
  routerPush.mockReset()
  welcomeVisible.value = false
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('welcome logic', () => {
  it('treats fairteiler detail and melden entries as deep links', () => {
    expect(isDeepLinkEntry('/fairteiler/810')).toBe(true)
    expect(isDeepLinkEntry('/melden')).toBe(true)
    expect(isDeepLinkEntry('/melden?fairteiler=810')).toBe(true)
    expect(isDeepLinkEntry('/')).toBe(false)
    expect(isDeepLinkEntry('/liste')).toBe(false)
  })

  it('shows only when not done and not a deep-link entry', () => {
    expect(shouldShowWelcome('/', false)).toBe(true)
    expect(shouldShowWelcome('/liste', false)).toBe(true)
    expect(shouldShowWelcome('/fairteiler/810', false)).toBe(false)
    expect(shouldShowWelcome('/melden', false)).toBe(false)
    expect(shouldShowWelcome('/', true)).toBe(false)
  })

  it('persists the done flag', () => {
    expect(isWelcomeDone()).toBe(false)
    markWelcomeDone()
    expect(isWelcomeDone()).toBe(true)
  })
})

describe('WelcomeOverlay', () => {
  it('is shown on a normal first open and closes via Los geht’s, setting the flag', async () => {
    const wrapper = mount(WelcomeOverlay)
    expect(wrapper.find('.welcome').exists()).toBe(true)
    expect(wrapper.text()).toContain('Schön, dass du da bist!')
    expect(wrapper.text()).toContain('Melden in 10 Sekunden')

    await wrapper.find('[data-test="welcome-start"]').trigger('click')
    expect(wrapper.find('.welcome').exists()).toBe(false)
    expect(isWelcomeDone()).toBe(true)
  })

  it('is not shown when the flag is already set', () => {
    markWelcomeDone()
    const wrapper = mount(WelcomeOverlay)
    expect(wrapper.find('.welcome').exists()).toBe(false)
  })

  it('the Gut zu wissen link navigates to /regeln and sets the flag', async () => {
    const wrapper = mount(WelcomeOverlay)
    await wrapper.find('[data-test="welcome-regeln"]').trigger('click')

    expect(routerPush).toHaveBeenCalledWith('/regeln')
    expect(isWelcomeDone()).toBe(true)
    expect(wrapper.find('.welcome').exists()).toBe(false)
  })

  it('moves focus to the start button when shown (keyboard modality)', async () => {
    const wrapper = mount(WelcomeOverlay, { attachTo: document.body })
    await flushPromises()
    expect(document.activeElement).toBe(
      wrapper.find('[data-test="welcome-start"]').element,
    )
    wrapper.unmount()
  })

  it('closes on Escape like Los geht’s and marks the flag', async () => {
    const wrapper = mount(WelcomeOverlay)
    expect(wrapper.find('.welcome').exists()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.welcome').exists()).toBe(false)
    expect(isWelcomeDone()).toBe(true)
  })

  it('sets the shared visibility used to make the app shell inert', async () => {
    expect(welcomeVisible.value).toBe(false)
    const wrapper = mount(WelcomeOverlay)
    expect(welcomeVisible.value).toBe(true)
    await wrapper.find('[data-test="welcome-start"]').trigger('click')
    expect(welcomeVisible.value).toBe(false)
  })
})

describe('App shell inert while welcome is up', () => {
  it('the shell wrapper carries the inert attribute until dismissal', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:rest(.*)*', component: { template: '<div>page</div>' } }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    const shell = wrapper.find('[data-test="app-shell"]')
    expect(shell.attributes()).toHaveProperty('inert')
    expect(wrapper.find('main').exists()).toBe(true)

    await wrapper.find('[data-test="welcome-start"]').trigger('click')
    expect(wrapper.find('[data-test="app-shell"]').attributes('inert')).toBeUndefined()
  })
})
