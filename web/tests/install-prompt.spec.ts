import { test, expect, type Page } from '@playwright/test';
import { CREDENTIALS, url, login, clearEverything } from './helpers';

/**
 * The install offer, which is the only route to an installed app on iOS and the
 * difference between a real button and "go and find it in your browser menu"
 * everywhere else.
 *
 * The bug these cover: `beforeinstallprompt` fires once, on Chrome's own
 * schedule (an interaction plus ~30s), which on this app lands while the
 * visitor is still on the login screen. The listener used to be attached by
 * InstallPrompt — a component that only mounts *after* sign-in — so the event
 * arrived with nothing listening and the real install button never appeared.
 */

const SESSION_KEY = 'krc.auth.session';
const DISMISSED_KEY = 'krc.install.dismissed';

/** The card, scoped by its dialog role so the OfflineStatus panel's own copy of
 *  these controls cannot satisfy an assertion about this one. */
function card(page: Page) {
  return page.getByRole('dialog', { name: 'Install this app' });
}

/**
 * Fire the event the way Chrome does, while the app is still on /login.
 *
 * `cancelable` matters: the store calls preventDefault() on it, and a
 * non-cancelable event would make that a silent no-op — the test would pass
 * against code that could never suppress Chrome's own mini-infobar.
 */
async function fireBeforeInstallPrompt(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (document.getElementById('root')?.childElementCount ?? 0) > 0,
    null,
    { timeout: 15_000 },
  );
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt?: () => Promise<void>;
      userChoice?: Promise<{ outcome: string }>;
    };
    event.prompt = () => Promise.resolve();
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(event);
  });
}

test.describe('install prompt', () => {
  test.beforeEach(async ({ context, page }) => {
    await clearEverything(context, page);
  });

  test('an install offer made before sign-in still produces a real button', async ({ page }) => {
    await page.goto(url('/login'));
    // Before the card — before anything that renders it — exists.
    await fireBeforeInstallPrompt(page);
    await expect(card(page)).toHaveCount(0);

    // Sign in on the document the event was delivered to, rather than through
    // the login() helper: its `goto` to the URL we are already on reloads in
    // WebKit, which would throw the event away and make this pass or fail on
    // navigation semantics instead of on the thing under test. A visitor types
    // into the form in front of them, which is exactly this.
    await page.fill('#email', CREDENTIALS.email);
    await page.fill('#password', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });

    await expect(card(page)).toBeVisible({ timeout: 15_000 });
    await expect(
      card(page).getByRole('button', { name: /install app/i }),
      'the deferred event was dropped, so the card fell back to the browser-menu hint',
    ).toBeVisible();
  });

  test('with no offer from the browser, the card explains the manual route', async ({ page }) => {
    await login(page);

    await expect(card(page)).toBeVisible({ timeout: 15_000 });
    // No beforeinstallprompt was fired, so a button here would be a dead one.
    await expect(card(page).getByRole('button', { name: /install app/i })).toHaveCount(0);
    await expect(card(page)).toContainText(/install app/i); // the menu instruction
  });

  test('dismissing hides it, and an aged-out session offers it again', async ({ page }) => {
    await login(page);
    await expect(card(page)).toBeVisible({ timeout: 15_000 });

    await card(page).getByRole('button', { name: 'Not now' }).click();
    await expect(card(page)).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), DISMISSED_KEY)).toBe('1');

    // Age the session past its 20 minutes, the way an abandoned tablet does.
    // The next visitor must be offered the install again — a dismissal belongs
    // to one visitor, not to the device.
    await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) throw new Error('no session to age out');
      const session = JSON.parse(raw);
      session.signedInAt = Date.now() - 25 * 60 * 1000;
      localStorage.setItem(key, JSON.stringify(session));
    }, SESSION_KEY);

    // A reload, not a goto: the tab we are in already holds the session in
    // memory, and storage events do not fire for the tab that wrote them. Only
    // a fresh document re-reads localStorage and takes the expiry branch.
    await page.reload();
    await expect(page).toHaveURL(/#\/login/);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), DISMISSED_KEY),
      'the dismissal outlived the session it belonged to',
    ).toBeNull();

    await login(page);
    await expect(card(page)).toBeVisible({ timeout: 15_000 });
  });
});
