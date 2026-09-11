import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { CREDENTIALS } from './helpers';

/**
 * Rule 24: on a plain http://192.168.x.x LAN address, service workers do not
 * register and nothing caches — silently. Anyone testing from another device on
 * the office WiFi hits this and reports "offline mode is broken".
 *
 * Rule 32: an earlier attempt overrode window.isSecureContext to exercise the
 * branch. The override did nothing (the flag is not writable in a way the
 * platform respects) and produced a confident false failure. So this test
 * stands up a real insecure origin instead of pretending.
 */

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function lanAddress(): string | null {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
        return net.address;
      }
    }
  }
  return null;
}

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

function serve(host: string): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let file = join(dist, path);
      if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
      res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
      createReadStream(file).pipe(res);
    });
    server.listen(0, host, () => {
      resolve({ server, port: (server.address() as { port: number }).port });
    });
  });
}

test('a plain-http LAN origin cannot cache, and says so', async ({ page }) => {
  const host = lanAddress();
  test.skip(!host, 'no non-loopback IPv4 interface on this machine');
  test.skip(!existsSync(dist), 'dist/ not built');

  const { server, port } = await serve(host!);
  const origin = `http://${host}:${port}`;

  try {
    await page.goto(`${origin}/#/login`);

    // Sanity: this really is an insecure context, so the branch under test is
    // the one the browser actually took — not one we forced.
    const secure = await page.evaluate(() => window.isSecureContext);
    expect(secure, `${origin} unexpectedly reports a secure context`).toBe(false);

    await page.fill('#email', CREDENTIALS.email);
    await page.fill('#password', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/#\/login/);

    await page.waitForTimeout(4000);

    const registrations = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 0;
      try {
        return (await navigator.serviceWorker.getRegistrations()).length;
      } catch {
        return 0;
      }
    });
    expect(registrations, 'a worker registered on an insecure origin').toBe(0);

    // And it is said out loud, rather than left as a silently useless install.
    // No click: the status pill this used to open was removed from the corner,
    // so the warning is a bar that shows itself — see OfflineStatus.
    await expect(page.getByText(/service workers need https/i)).toBeVisible();
  } finally {
    server.close();
  }
});
