# KRC Pune — Web

Web build of the KRC Pune experience (React + Vite): VR tour, amenities,
location, and inventory.

This folder is the **web-only** copy. The Windows/Electron version lives in
`../desktop/` and is maintained separately — a change made here must be applied
there too (and vice versa).

## Local development

```bash
npm install    # install dependencies
npm run dev    # start the Vite dev server
npm run build  # production build → dist/
npm run preview # serve the production build locally
```

## Deployment (Vercel)

Deployment is driven by `../vercel.json` at the repository root:

- Install: `cd web && npm install`
- Build: `cd web && npm run build`
- Output: `web/dist`

`vite.config.ts` uses `base: '/'` because the app is served from the domain
root. (The desktop build uses `base: './'` so it works over `file://`.)

SPA routing fallbacks ship in `public/`: `_redirects` (Netlify-style) and
`web.config` (IIS). `public/vercel.json` sets long-lived cache headers for
`/media` and `/assets`.

> Note: `public/media` is ~510 MB (full-resolution panoramas and videos), the
> same assets the offline desktop kiosk bundles. Expect slow deploys and heavy
> first loads until these are compressed or moved to a CDN.

## Login gate

Credentials are hardcoded in `src/lib/auth.ts` (`krcpune@gmail.com` /
`krcpune123`) and the session is a localStorage flag that expires 20 minutes
after sign-in (`SESSION_TTL_MS`), so the next visitor to a shared device has to
sign in rather than inheriting the last one's session. Expiry is absolute, not
idle-based, and is enforced on read, on a timer, and again whenever the page
returns to the foreground — a sleeping tablet does not run timers on schedule. There is no backend, so
this is **not** a security boundary — anyone can read the constants out of the
bundle. Its job is to stop a logged-out visitor from pulling ~510 MB onto their
device and from installing the app.

- `/#/login` is the only public route. Everything else renders through
  `ProtectedRootLayout`, so a route added to the router is guarded by default.
- The attempted URL is kept in `location.state.from`, so a deep link into
  `/#/vr` survives the redirect.
- Auth is reactive (`onAuthChange` + a `storage` listener), which is what lets
  the download and the install prompt switch on the instant someone signs in —
  no reload — and lets a sign-out in one tab lock every other tab.

## Offline / PWA

The acceptance criterion is that after one load on WiFi the whole app works with
the network off — every route, the brochure PDF, every video, the VR panoramas.

**Nothing offline-related runs until the user is authenticated.** `main.tsx`
calls `installOfflineBootstrap()`, which only registers the service worker and
starts the media download once a session exists.

Two tiers, on purpose:

| | what | why |
|---|---|---|
| **Precache** (`dist/sw.js`) | app shell, JS/CSS, bundled images, the brochure PDF, `Location_Video.mp4` — 43 entries | small, always needed |
| **Runtime** (`krc-offline-media`) | the 111 files in `public/media`, ~510 MB | precache install is all-or-nothing; one failure out of 111 would mean *nothing* cached |

`src/offline/offlineDownload.ts` writes to the cache with an explicit
`cache.put` rather than letting the worker's `CacheFirst` route do it. A
freshly installed worker does not control the page that registered it, so on a
first visit those fetches sail straight past it: the progress bar reaches 98 %,
half a gigabyte really is downloaded, and the cache is empty. `clientsClaim` is
also on, but the explicit put is what makes it deterministic.

The worker's `/media/` route still matters — `RangeRequestsPlugin` is what turns
a cached full response into the `206`s that `<video>` seeking needs offline.

### iOS / iPadOS — read before promising anything

- There is no `beforeinstallprompt` on iOS, and every browser there is WebKit
  underneath, so **no install button can work**. Only Share → Add to Home
  Screen, which sits below the app-icon row in the share sheet. The app ships an
  iOS-only hint, never a dead button.
- Safari ignores `navigator.storage.persist()`. There is no way to stop iOS
  evicting the cache; the UI says so instead of promising otherwise.
- Safari and the installed app have **separate storage**. Testers must install
  first, then let the download run inside the app.
- Over plain `http://192.168.x.x` nothing registers and nothing caches. The app
  detects the insecure context and says so rather than failing silently.

## Checks

```bash
npm run typecheck      # tsc --noEmit
npm run build          # runs prebuild → regenerates the media manifest
npm run verify:build   # asserts on dist/: precache coverage, range support, no media precached
npm run audit:videos   # ffprobe every video: resolution, level, bitrate, moov position
npm run test:offline   # Playwright: auth gate + full offline suite, Chromium and WebKit
```

`verify:build` compares the precache manifest against the real `dist/` file list
rather than asserting on a count — the manifest legitimately contains duplicate
entries, so a count proves nothing. It has already caught one real bug (`.mp4`
missing from `globPatterns`, which would have worked online and broken offline).

Always build into a fresh `dist/` before inspecting it.
