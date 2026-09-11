import { test } from '@playwright/test';
import { url, login } from './helpers';

/**
 * Not assertions — these exist so the login design can actually be looked at
 * rather than described. Written to test-results/screens/.
 */
test.describe('screens', () => {
  test('login at 1280x800 (iPad landscape)', async ({ page }) => {
    await page.goto(url('/login'));
    await page.waitForTimeout(1800); // let the entry animations settle
    await page.screenshot({ path: 'test-results/screens/login-desktop.png' });
  });

  test('login with an error shown', async ({ page }) => {
    await page.goto(url('/login'));
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'nope');
    await page.click('button[type="submit"]');
    await page.getByRole('alert').waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'test-results/screens/login-error.png' });
  });

  test('login at 430x932 (phone — left panel becomes a faded background)', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(url('/login'));
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'test-results/screens/login-mobile.png' });
  });

  /**
   * Was "offline panel, signed in". That panel no longer exists — the status
   * pill was removed from the corner (see OfflineStatus) and the project guide
   * took its place, so this now photographs the thing that is actually there.
   * Skipped rather than failing in a build with no guide key configured.
   */
  test('the project guide, signed in', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(3000);

    const launcher = page.getByRole('button', { name: 'Ask the guide' });
    test.skip((await launcher.count()) === 0, 'no guide key in this build');

    await page.screenshot({ path: 'test-results/screens/guide-launcher.png' });
    await launcher.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/screens/guide-panel.png' });
  });
});
