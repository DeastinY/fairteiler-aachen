import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DatenschutzView from '../src/views/DatenschutzView.vue'
import ImpressumView from '../src/views/ImpressumView.vue'
import MehrView from '../src/views/MehrView.vue'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }
})

const globalStubs = { global: { stubs: { RouterLink: RouterLinkStub } } }

describe('MehrView', () => {
  it('links to Einstellungen, Impressum and Datenschutz', () => {
    const wrapper = mount(MehrView, globalStubs)
    const targets = wrapper
      .findAllComponents(RouterLinkStub)
      .map((link) => link.props('to'))
    expect(targets).toContain('/einstellungen')
    expect(targets).toContain('/regeln')
    expect(targets).toContain('/statistik')
    expect(targets).toContain('/impressum')
    expect(targets).toContain('/datenschutz')
  })

  it('marks chevrons with the RTL mirror class', () => {
    const wrapper = mount(MehrView, globalStubs)
    expect(wrapper.findAll('svg.dir-flip').length).toBeGreaterThanOrEqual(4)
  })

  it('describes the project and links foodsharing.de as a user-clicked link', () => {
    const wrapper = mount(MehrView, globalStubs)
    expect(wrapper.text()).toContain('unabhängiges, privates und nichtkommerzielles')
    expect(wrapper.text()).toContain('keine Verbindung zum foodsharing e.V.')
    expect(wrapper.text()).toContain('rein beschreibend')
    expect(wrapper.text()).toContain('Quellcode ist offen (AGPL-3.0)')

    const external = wrapper.find('a.extlink')
    expect(external.attributes('href')).toBe('https://foodsharing.de/region/aachen')
    expect(external.attributes('rel')).toBe('noopener noreferrer')
    expect(external.attributes('target')).toBe('_blank')
  })
})

describe('legal pages', () => {
  it('Impressum renders operator details and credits', () => {
    const wrapper = mount(ImpressumView, globalStubs)
    expect(wrapper.find('h1').text()).toBe('Impressum')
    expect(wrapper.text()).toContain('Angaben gemäß § 5 DDG')
    expect(wrapper.text()).toContain('§ 18 Abs. 2 MStV')
    expect(wrapper.text()).toContain('Haftung für Inhalte')
    expect(wrapper.text()).toContain('Richard Polzin')
    expect(wrapper.text()).toContain('Dammstraße 43')
    expect(wrapper.text()).toContain('52066 Aachen')
    expect(wrapper.text()).toContain('richard.polzin@posteo.de')
    // no unfilled placeholders remain
    expect(wrapper.findAll('mark.ph')).toHaveLength(0)
    // credits
    expect(wrapper.text()).toContain('Dank & beteiligte Projekte')
    expect(wrapper.text()).toContain('Uberspace')
    expect(wrapper.text()).toContain('foodsharing.de')
    expect(wrapper.text()).toContain('AGPL-3.0')
  })

  it('Datenschutz renders all sections with real operator data', () => {
    const wrapper = mount(DatenschutzView, globalStubs)
    expect(wrapper.find('h1').text()).toBe('Datenschutzerklärung')
    for (const heading of [
      '1. Verantwortlicher',
      '2. Grundsatz',
      '3. Server-Logdateien',
      '4. Geräte-Kennung (Local Storage)',
      '5. Meldungen',
      '6. Standort (optional)',
      '7. Push-Benachrichtigungen (optional)',
      '8. Empfänger und Drittländer',
      '9. Speicherdauer',
      '10. Deine Rechte',
    ]) {
      expect(wrapper.text()).toContain(heading)
    }
    expect(wrapper.text()).toContain('Stand: 3. September 2026')
    expect(wrapper.text()).toContain('Richard Polzin')
    expect(wrapper.findAll('mark.ph')).toHaveLength(0)
    expect(wrapper.text()).toContain('Meldungen werden nach 90 Tagen gelöscht')
    expect(wrapper.text()).toContain('Art. 11 DSGVO')
  })
})
