import { defineConfig, devices } from '@playwright/test';

/**
 * Tests run against the *built* app served by `vite preview`, never the dev
 * server: the dev server has no service worker and no precache manifest, so an
 * offline test there would prove nothing.
 *
 * localhost counts as a secure context, so the worker registers over plain http
 * here. That is the one place http is legitimate — see the insecure-origin test
 * for the LAN case (rule 24/32).
 */
const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  // The media download is ~510 MB over loopback; the offline suite is slow by
  // nature and must not be cut short into a false failure.
  timeout: 15 * 60 * 1000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-ipad-landscape',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      // Apple targets are WebKit, so Chrome-only testing cannot speak for them.
      // Caveat recorded in the spec: the Windows/Linux WebKit build ships
      // without H.264, so it validates layout and caching but NOT decoding.
      name: 'webkit-ipad-landscape',
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } },
    },
  ],

  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
