import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import BottomNav from '../src/components/BottomNav.vue'
import { _resetI18nForTests, setLocale } from '../src/i18n'

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:rest(.*)*', component: { template: '<div />' } }],
  })
}

async function mountAt(path: string) {
  const router = makeRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(BottomNav, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

function activeLabel(wrapper: Awaited<ReturnType<typeof mountAt>>): string | null {
  const active = wrapper.findAll('.navbtn.active')
  if (active.length === 0) return null
  expect(active).toHaveLength(1) // never two active tabs
  return active[0]!.text()
}

beforeEach(() => {
  localStorage.clear()
  _resetI18nForTests()
})

afterEach(() => {
  _resetI18nForTests()
})

describe('BottomNav active-tab mapping', () => {
  it('maps every route to its tab (detail counts as Liste, settings pages as Mehr)', async () => {
    const cases: [string, string | null][] = [
      ['/', 'Karte'],
      ['/liste', 'Liste'],
      ['/fairteiler/810', 'Liste'],
      ['/aktivitaet', 'Aktivität'],
      ['/mehr', 'Mehr'],
      ['/einstellungen', 'Mehr'],
      ['/regeln', 'Mehr'],
      ['/statistik', 'Mehr'],
      ['/impressum', 'Mehr'],
      ['/datenschutz', 'Mehr'],
      // melden is the center FAB, no tab highlights
      ['/melden', null],
      ['/nirgendwo', null],
    ]
    for (const [path, expected] of cases) {
      const wrapper = await mountAt(path)
      expect(activeLabel(wrapper), path).toBe(expected)
      wrapper.unmount()
    }
  })

  it('renders the four tab labels and the FAB aria-label through i18n', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.text()).toContain('Karte')
    expect(wrapper.text()).toContain('Liste')
    expect(wrapper.text()).toContain('Aktivität')
    expect(wrapper.text()).toContain('Mehr')
    expect(wrapper.find('.navplus').attributes('aria-label')).toBe('Meldung erstellen')

    await setLocale('en')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Map')
    expect(wrapper.text()).toContain('More')
    expect(wrapper.find('.navplus').attributes('aria-label')).toBe('Create report')
  })
})
