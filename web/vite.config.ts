import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Web build — served over http(s) from the domain root, so an absolute base.
// (The desktop build uses base: './' because it loads over file:// in Electron.)
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      // We register the worker ourselves, from the authenticated bootstrap path
      // only — see src/offline/registerServiceWorker.ts. Auto-injecting the
      // registration would install a worker for logged-out visitors, which is
      // exactly what this feature is meant to prevent.
      injectRegister: null,
      registerType: 'prompt',

      manifest: {
        name: 'KRC Pune — Experience Centre',
        short_name: 'KRC Pune',
        description: 'VR tour, amenities, floor plans and inventory for KRC Pune.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#05101f',
        theme_color: '#05101f',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // Enumerate every extension that actually ships (rule 7). A missing
        // extension here is invisible until the network is off. Kept broader
        // than today's asset list on purpose, so adding a font or a .wasm later
        // does not silently fall out of the precache.
        globPatterns: [
          '**/*.{js,css,html,json,txt,webmanifest}',
          '**/*.{png,jpg,jpeg,webp,gif,svg,ico,avif}',
          '**/*.{woff,woff2,ttf,otf,eot}',
          '**/*.{pdf,wasm,bcmap,pfb,icc}',
          // Bundled videos land in dist/assets (public/media is excluded below).
          // Leaving mp4 out of this list is invisible until the network is off:
          // verify-build.mjs caught exactly that with Location_Video.
          '**/*.{mp4,webm}',
        ],

        // Rule 10: precache install is all-or-nothing, and rule 11: never
        // precache unreferenced files. The ~500 MB media library is therefore
        // pulled at runtime, per file, by startOfflineDownload().
        globIgnores: ['media/**', '**/node_modules/**'],

        // Default is 2 MB, which would silently drop the brochure PDF and the
        // large renders — they would work online and break offline, the exact
        // failure mode these rules exist to prevent.
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,

        cleanupOutdatedCaches: true,
        // Take control of the page that registered us instead of waiting for
        // the next navigation. Without this the first session runs completely
        // uncontrolled, so nothing the page fetches is ever routed through the
        // worker. (skipWaiting stays off — updates go through the prompt.)
        clientsClaim: true,
        // Hash routing means every navigation resolves to the same document.
        navigateFallback: '/index.html',

        runtimeCaching: [
          {
            // Must match MEDIA_CACHE in src/offline/offlineDownload.ts, or the
            // downloader and the worker would use two different caches.
            // The `krc-direct` exclusion lets startOfflineDownload() fetch
            // straight from the network — see SW_BYPASS in offlineDownload.ts.
            // Handling those here would have the worker fetch and cache the
            // same file the page is already fetching and caching, which is what
            // broke the two large videos. Playback requests carry no marker and
            // still land on this route.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/media/') && !url.searchParams.has('krc-direct'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'krc-offline-media',
              // Rule 17: <video> seeking issues Range requests. Without this,
              // playback from cache breaks the moment the user scrubs — or
              // never starts at all in Safari, which always ranges.
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
