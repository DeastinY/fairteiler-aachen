/** Minimal, safe markdown for upstream Fairteiler descriptions.
 *
 * The input is UNTRUSTED (written by foodsharing users). Everything is
 * HTML-escaped first; only our own tags are emitted afterwards, so the
 * result is safe for v-html. Supported: paragraphs, line breaks, bullet
 * lists (* / -), **bold**, *italic*, horizontal rules, https auto-links.
 */

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function inline(text: string): string {
  let out = text
  // auto-link https URLs (already escaped, so quotes can't break out)
  out = out.replace(
    /https:\/\/[^\s<>&]+[^\s<>&.,)]/g,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  )
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  return out
}

export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return ''
  const lines = escapeHtml(source.replace(/\r\n/g, '\n')).split('\n')
  const blocks: string[] = []
  let paragraph: string[] = []
  let list: string[] = []

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push(`<p>${paragraph.map(inline).join('<br>')}</p>`)
      paragraph = []
    }
  }
  function flushList() {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`)
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      flushList()
    } else if (/^-{3,}$/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push('<hr>')
    } else if (/^[*-]\s+/.test(line)) {
      flushParagraph()
      list.push(line.replace(/^[*-]\s+/, ''))
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks.join('')
}
