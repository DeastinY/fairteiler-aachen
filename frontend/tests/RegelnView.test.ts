import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RegelnView from '../src/views/RegelnView.vue'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }
})

describe('RegelnView', () => {
  it('renders the Gut zu wissen page with all sections', () => {
    const wrapper = mount(RegelnView, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.find('h1').text()).toBe('Gut zu wissen')
    expect(wrapper.text()).toContain('weil alle ein bisschen mitdenken')

    expect(wrapper.text()).toContain('Das gehört nicht hinein')
    expect(wrapper.text()).toContain('rohes Fleisch, roher Fisch und Speisen mit rohem Ei')
    expect(wrapper.text()).toContain('zu verbrauchen bis')
    expect(wrapper.text()).toContain('Hochprozentiger Alkohol')
    expect(wrapper.text()).toContain('Beachte außerdem die Aushänge')

    expect(wrapper.text()).toContain('Das ist okay')
    expect(wrapper.text()).toContain('Mindesthaltbarkeitsdatum')
    expect(wrapper.text()).toContain('Augen, Nase und Verstand')
    expect(wrapper.text()).toContain('Selbstgekochtes nur mit Zettel: Zutaten und Datum.')

    expect(wrapper.text()).toContain('Vor Ort mitdenken')
    expect(wrapper.text()).toContain('Kühlschranktüren gut schließen.')
    expect(wrapper.text()).toContain('Fotografiere keine anderen Menschen')

    expect(wrapper.text()).toContain('ohne Gewähr')
    expect(wrapper.text()).toContain('Hygieneregeln von foodsharing.de')
  })
})
