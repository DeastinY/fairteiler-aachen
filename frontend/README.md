# Fairteiler Aachen — Frontend

Vue 3 + Vite + TypeScript PWA (Karte als Schemakarte ohne externe Kachel-Server,
Liste, Detail, Melden, Aktivität). Talks only to our own backend under `/api`
(dev proxy to `http://127.0.0.1:8000`, see `vite.config.ts`) — never to
foodsharing.de. The only external resource is the Google Fonts stylesheet.

- Offline: service worker (vite-plugin-pwa/Workbox) precaches the shell and
  keeps `/api/fairteiler*` GETs for ~6h (NetworkFirst); POSTs are never
  intercepted. Views show "Offline – letzter bekannter Stand" when offline.
- Installable: manifest + icons in `public/icons/` (rendered from
  `public/favicon.svg` via rsvg-convert).

## Commands

```sh
npm install       # once
npm run dev       # dev server (expects the backend on 127.0.0.1:8000)
npm run test      # Vitest (all fetches mocked, no backend needed)
npm run build     # type check (vue-tsc) + production build incl. SW/manifest
npm run typecheck # type check only
```
