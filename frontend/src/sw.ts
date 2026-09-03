/// <reference lib="webworker" />
/**
 * Service worker (vite-plugin-pwa injectManifest build).
 * - precaches the app shell
 * - NetworkFirst for GET /api/fairteiler* (last known statuses stay visible
 *   offline, ~6h); POSTs and every other request are never intercepted
 * - Web Push: shows notifications and opens the target Fairteiler on click
 */
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { isFairteilerApiUrl } from './lib/apiBase'
import { parsePushPayload } from './lib/push'

declare let self: ServiceWorkerGlobalScope

const BASE_URL = import.meta.env.BASE_URL
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA navigations fall back to the precached shell; API routes never do.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL(`${BASE_URL}index.html`), {
    denylist: [/\/api\//],
  }),
)

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    isFairteilerApiUrl(url.href, API_BASE, self.location.origin),
  new NetworkFirst({
    cacheName: 'api-fairteiler',
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 6 * 60 * 60 }),
    ],
  }),
)

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event.data?.text())
  if (!payload) return
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: `${BASE_URL}icons/icon-192.png`,
      data: { url: payload.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path: string = (event.notification.data?.url as string | undefined) ?? '/'
  // payload paths like /fairteiler/810 are app routes relative to our scope
  const target = new URL(path.replace(/^\//, ''), self.registration.scope).href
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const existing = clients.find((client) => client.url.startsWith(self.registration.scope))
      if (existing) {
        await existing.focus()
        if ('navigate' in existing) await existing.navigate(target)
        return
      }
      await self.clients.openWindow(target)
    })(),
  )
})
