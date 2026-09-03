// Guard: every precached URL must exist in dist/, and none may live under a
// path Apache shadows with built-in aliases (the /icons/ trap that silently
// broke SW installation in production).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const APACHE_RESERVED = ['icons/', 'cgi-bin/', 'error/']

const sw = readFileSync('dist/sw.js', 'utf8')
const urls = [
  ...new Set(
    [...sw.matchAll(/"([^"?]+\.(?:js|css|html|woff2|png|svg|webmanifest|ico))"/g)].map(
      (m) => m[1],
    ),
  ),
]
if (urls.length < 10) {
  console.error(`suspiciously few precache entries (${urls.length}) — parser broken?`)
  process.exit(1)
}
let failed = false
for (const url of urls) {
  if (!existsSync(join('dist', url))) {
    console.error(`precached but missing in dist/: ${url}`)
    failed = true
  }
  const reserved = APACHE_RESERVED.find((p) => url.startsWith(p))
  if (reserved) {
    console.error(`precached under Apache-reserved path (${reserved}): ${url}`)
    failed = true
  }
}
if (failed) process.exit(1)
console.log(`precache ok: ${urls.length} entries exist, no reserved paths`)
