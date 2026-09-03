# Fairteiler Aachen — Frontend

Vue 3 + Vite + TypeScript PWA: Leaflet-Karte (basemap.de/BKG-Kacheln), Liste
mit Filtern (Etwas da / Rund um die Uhr / Gekühlt), Detail mit Route-Absprung
und Undo eigener Meldungen, Melden inkl. Zustandsmeldungen (gereinigt /
Reinigung nötig / defekt), Aktivität mit Push-Toggles, Willkommens-Screen,
Mehr (Einstellungen, Regeln, Impressum, Datenschutz).

Runtime-Hosts: unser Backend (`/api`) und die Kartenkacheln von
`sgx.geodatenzentrum.de` (basemap.de, staatlich betrieben) – sonst nichts.
Fonts sind selbst gehostet (GDPR). Links (foodsharing.de, Navigation,
Attribution) sind reine User-Klicks.

- Service worker (`src/sw.ts`, injectManifest): App-Shell precache,
  NetworkFirst für GET `/api/fairteiler*` (~6h), CacheFirst für Kacheln
  (~7 Tage, 300 Stück), Web Push. POSTs werden nie abgefangen.
- Deploy-Env: `VITE_BASE` (Pfad, z. B. `/fairteiler-aachen/`),
  `VITE_API_BASE` (API-Origin bei Cross-Origin-Deploy). `dist/404.html`
  wird für GitHub Pages erzeugt.

## Commands

```sh
npm install       # once
npm run dev       # dev server (expects the backend on 127.0.0.1:8000)
npm run test      # Vitest (all fetches mocked, no backend needed)
npm run build     # type check (vue-tsc) + production build incl. SW/manifest
npm run typecheck # type check only
```
