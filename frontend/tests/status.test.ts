import { describe, expect, it } from 'vitest'
import { statusMeta } from '../src/lib/status'

describe('statusMeta', () => {
  it('maps etwas_da to a green chip', () => {
    const meta = statusMeta('etwas_da')
    expect(meta.label).toBe('Etwas da')
    expect(meta.badgeClass).toBe('badge-green')
    expect(meta.dotColor).toBe('#2f7d54')
  })

  it('maps leer to a gray chip', () => {
    const meta = statusMeta('leer')
    expect(meta.label).toBe('Leer gemeldet')
    expect(meta.badgeClass).toBe('badge-gray')
  })

  it('maps keine_meldung to an amber chip', () => {
    const meta = statusMeta('keine_meldung')
    expect(meta.label).toBe('Keine aktuelle Meldung')
    expect(meta.badgeClass).toBe('badge-amber')
  })

  it('falls back to keine_meldung for unknown states', () => {
    expect(statusMeta('unbekannt').badgeClass).toBe('badge-amber')
  })
})
