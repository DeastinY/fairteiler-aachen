import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiUrl, isFairteilerApiUrl, joinApiUrl } from '../src/lib/apiBase'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('joinApiUrl', () => {
  it('returns the plain path without a base', () => {
    expect(joinApiUrl(undefined, '/api/fairteiler')).toBe('/api/fairteiler')
    expect(joinApiUrl('', '/api/fairteiler')).toBe('/api/fairteiler')
  })

  it('prefixes the base and strips trailing slashes', () => {
    expect(joinApiUrl('https://api.example.org', '/api/fairteiler')).toBe(
      'https://api.example.org/api/fairteiler',
    )
    expect(joinApiUrl('https://api.example.org/', '/api/push/config')).toBe(
      'https://api.example.org/api/push/config',
    )
  })
})

describe('apiUrl (VITE_API_BASE)', () => {
  it('is same-origin by default', () => {
    expect(apiUrl('/api/fairteiler')).toBe('/api/fairteiler')
  })

  it('uses VITE_API_BASE when set', () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.example.org')
    expect(apiUrl('/api/fairteiler/810/reports')).toBe(
      'https://api.example.org/api/fairteiler/810/reports',
    )
  })
})

describe('isFairteilerApiUrl', () => {
  const page = 'https://user.github.io'

  it('matches same-origin API URLs without a base', () => {
    expect(isFairteilerApiUrl(`${page}/api/fairteiler`, '', page)).toBe(true)
    expect(isFairteilerApiUrl(`${page}/api/fairteiler/810`, undefined, page)).toBe(true)
    expect(isFairteilerApiUrl(`${page}/api/push/config`, '', page)).toBe(false)
  })

  it('matches only the configured API host when a base is set', () => {
    const base = 'https://api.example.org'
    expect(isFairteilerApiUrl('https://api.example.org/api/fairteiler', base, page)).toBe(true)
    expect(isFairteilerApiUrl(`${page}/api/fairteiler`, base, page)).toBe(false)
  })
})
