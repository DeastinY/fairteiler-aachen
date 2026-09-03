/// <reference types="vitest/config" />
import { copyFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub Pages serves 404.html for unknown paths – make it the SPA shell. */
function spaFallback404(): PluginOption {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE ?? '/'
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'),
  ) as { version: string }

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      vue(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Fairteiler Aachen',
          short_name: 'Fairteiler',
          description:
            'Live-Status der Fairteiler in Aachen – schauen, was da ist, und in 10 Sekunden melden.',
          lang: 'de',
          display: 'standalone',
          start_url: '.',
          scope: '.',
          theme_color: '#f4f1e9',
          background_color: '#f4f1e9',
          icons: [
            { src: 'app-icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'app-icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'app-icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          globIgnores: ['**/404.html'],
        },
      }),
      spaFallback404(),
    ],
    server: {
      proxy: {
        // Dev only: forward API calls to the local backend. The app itself
        // only ever talks to our own backend – never to foodsharing.de.
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'happy-dom',
      include: ['tests/**/*.test.ts'],
    },
  }
})
