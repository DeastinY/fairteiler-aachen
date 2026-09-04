import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initTheme, resolveTheme, setTheme, theme } from '../src/composables/theme'

function stubMatchMedia(dark: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.head.innerHTML = '<meta name="theme-color" content="#f4f1e9">'
  stubMatchMedia(false)
})

describe('theme', () => {
  it('resolves the effective theme', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('follows the system by default and stamps nothing', () => {
    initTheme()
    expect(theme.value).toBe('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('forces a choice, persists it and updates the browser theme colour', () => {
    initTheme()
    setTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#14170f',
    )
    expect(localStorage.getItem('fairteiler-theme')).toBe('dark')

    setTheme('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('restores a stored choice', () => {
    localStorage.setItem('fairteiler-theme', 'light')
    initTheme()
    expect(theme.value).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('survives unavailable storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => initTheme()).not.toThrow()
    expect(theme.value).toBe('system')
    getItem.mockRestore()
  })
})
