import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/lib/markdown'

describe('renderMarkdown', () => {
  it('escapes raw HTML — descriptions are untrusted', () => {
    const html = renderMarkdown('<script>alert(1)</script> & <img src=x onerror=y>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
  })

  it('renders bold and keeps umlauts', () => {
    expect(renderMarkdown('Es gibt hier **keinen** Kühlschrank.')).toContain(
      '<strong>keinen</strong> Kühlschrank',
    )
  })

  it('renders bullet lists from * and - lines', () => {
    const html = renderMarkdown('- Regal\n* Kühlschrank')
    expect(html).toContain('<ul>')
    expect(html.match(/<li>/g)).toHaveLength(2)
    expect(html).toContain('<li>Regal</li>')
  })

  it('renders horizontal rules and paragraphs', () => {
    const html = renderMarkdown('Oben\n\n----------\n\nUnten')
    expect(html).toContain('<hr>')
    expect(html.match(/<p>/g)!.length).toBeGreaterThanOrEqual(2)
  })

  it('auto-links plain https URLs safely, nothing else', () => {
    const html = renderMarkdown('Siehe https://example.org/pfad und javascript:alert(1)')
    expect(html).toContain('<a href="https://example.org/pfad"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).not.toContain('href="javascript:')
  })

  it('keeps single line breaks inside a paragraph', () => {
    expect(renderMarkdown('Zeile 1\nZeile 2')).toContain('Zeile 1<br>Zeile 2')
  })

  it('handles empty input', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown(null)).toBe('')
  })
})

import { softBreakSlashes } from '../src/lib/text'

describe('softBreakSlashes', () => {
  it('adds a zero-width break after slashes only', () => {
    const out = softBreakSlashes('Bayernallee/Kalverbenden')
    expect(out).toContain('/​')
    expect(out.replace(/​/g, '')).toBe('Bayernallee/Kalverbenden')
    expect(softBreakSlashes('Hirschgrün')).toBe('Hirschgrün')
  })
})
