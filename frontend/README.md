# Fairteiler Aachen — Frontend

Vue 3 + Vite + TypeScript app shell (Karte-Platzhalter, Liste, Detail, Melden,
Aktivität). Talks only to our own backend under `/api` (dev proxy to
`http://127.0.0.1:8000`, see `vite.config.ts`) — never to foodsharing.de.

## Commands

```sh
npm install       # once
npm run dev       # dev server (expects the backend on 127.0.0.1:8000)
npm run test      # Vitest (all fetches mocked, no backend needed)
npm run build     # type check (vue-tsc) + production build to dist/
npm run typecheck # type check only
```
