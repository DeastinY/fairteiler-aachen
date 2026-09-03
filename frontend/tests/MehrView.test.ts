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
  it('links to Impressum and Datenschutz', () => {
    const wrapper = mount(MehrView, globalStubs)
    const targets = wrapper
      .findAllComponents(RouterLinkStub)
      .map((link) => link.props('to'))
    expect(targets).toContain('/impressum')
    expect(targets).toContain('/datenschutz')
  })

  it('describes the project and links foodsharing.de as a user-clicked link', () => {
    const wrapper = mount(MehrView, globalStubs)
    expect(wrapper.text()).toContain('ehrenamtliches, nicht-kommerzielles')
    expect(wrapper.text()).toContain('ergänzt foodsharing.de')
    expect(wrapper.text()).toContain('Quellcode')

    const external = wrapper.find('a.extlink')
    expect(external.attributes('href')).toBe('https://foodsharing.de/region/aachen')
    expect(external.attributes('rel')).toBe('noopener noreferrer')
    expect(external.attributes('target')).toBe('_blank')
  })
})

describe('legal pages', () => {
  it('Impressum renders with visibly marked placeholders', () => {
    const wrapper = mount(ImpressumView, globalStubs)
    expect(wrapper.find('h1').text()).toBe('Impressum')
    expect(wrapper.text()).toContain('Angaben gemäß § 5 DDG')
    expect(wrapper.text()).toContain('§ 18 Abs. 2 MStV')
    expect(wrapper.text()).toContain('Haftung für Inhalte')

    const placeholders = wrapper.findAll('mark.ph').map((m) => m.text())
    expect(placeholders).toContain('[VOR- UND NACHNAME]')
    expect(placeholders).toContain('[STRASSE UND HAUSNUMMER]')
    expect(placeholders).toContain('[PLZ]')
    expect(placeholders).toContain('[KONTAKT-E-MAIL]')
  })

  it('Datenschutz renders all sections and placeholders', () => {
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
    const placeholders = wrapper.findAll('mark.ph').map((m) => m.text())
    expect(placeholders).toContain('[DATUM DER VERÖFFENTLICHUNG]')
    expect(wrapper.text()).toContain('Meldungen werden nach 90 Tagen gelöscht')
    expect(wrapper.text()).toContain('Art. 11 DSGVO')
  })
})
