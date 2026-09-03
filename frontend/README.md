# Fairteiler Aachen — Frontend

Vue 3 + Vite + TypeScript PWA (Schemakarte, Liste, Detail, Melden, Aktivität
mit Push-Toggles, Mehr mit Impressum/Datenschutz). Talks only to our own
backend under `/api` — never to foodsharing.de (the Mehr tab contains one
user-clicked link to foodsharing.de, no request our app makes). Fonts are
self-hosted (`public/fonts/`, GDPR); there are ZERO external hosts at runtime.

- Service worker (`src/sw.ts`, injectManifest): precaches the shell + fonts +
  icons, NetworkFirst for GET `/api/fairteiler*` (~6h), Web Push notifications
  (`push` + `notificationclick`). POSTs are never intercepted.
- Push UI: Aktivität tab reads `/api/push/config`; toggles PUT the full state
  to `/api/push/subscription` after browser permission.
- Legal texts live in `../docs/legal/*.md` and are mirrored verbatim in the
  Impressum/Datenschutz views. `[PLACEHOLDER]` marks must be filled before
  launch (styled amber in the app).

## Deployment (GitHub Pages / cross-origin API)

Environment variables at build time:

- `VITE_BASE` – public base path, e.g. `/fairteiler-aachen/` (default `/`)
- `VITE_API_BASE` – API origin, e.g. `https://api.example.org`
  (default empty = same origin / dev proxy)

`npm run build` also writes `dist/404.html` (SPA fallback for Pages).

## Commands

```sh
npm install       # once
npm run dev       # dev server (expects the backend on 127.0.0.1:8000)
npm run test      # Vitest (all fetches mocked, no backend needed)
npm run build     # type check (vue-tsc) + production build incl. SW/manifest
npm run typecheck # type check only
```
