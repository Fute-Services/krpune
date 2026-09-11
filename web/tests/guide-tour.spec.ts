/**
 * The guided tour, driven end to end.
 *
 * Run against a build with a guide key; without one the launcher is absent and
 * these skip themselves. Muting first is deliberate — it puts the tour on its
 * dwell timer instead of waiting on ElevenLabs, so the run is quick and does not
 * depend on audio playing in a headless browser.
 */
import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { TOUR } from '../src/chatbot/tour';

test('live: the tour walks every stop by itself', async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await login(page);
  const launcher = page.getByRole('button', { name: 'Ask the guide' });
  test.skip((await launcher.count()) === 0, 'no guide key in this build');
  await launcher.click();
  const panel = page.getByRole('dialog', { name: 'Project guide' });

  // Mute so the tour runs on its dwell timer instead of waiting on audio.
  await panel.getByRole('button', { name: 'Turn the voice off' }).click();
  await panel.getByRole('button', { name: /Take me on the tour/i }).click();

  const visited: string[] = [];
  for (const stop of TOUR) {
    await expect(page, `tour never reached ${stop.path}`).toHaveURL(
      new RegExp(`#${stop.path.replace(/\//g, '\/')}$`),
      { timeout: 30_000 },
    );
    visited.push(stop.path);
  }
  console.log('TOUR VISITED: ' + visited.join(' -> '));

  // It ends on its own rather than looping or stalling.
  await expect(panel.getByText(/Tour ·/)).toHaveCount(0, { timeout: 30_000 });
  expect(errors, errors.join(' | ')).toEqual([]);
});

test('live: asking a question mid-tour stops the tour', async ({ page }) => {
  test.setTimeout(180_000);
  await login(page);
  const launcher = page.getByRole('button', { name: 'Ask the guide' });
  test.skip((await launcher.count()) === 0, 'no guide key in this build');
  await launcher.click();
  const panel = page.getByRole('dialog', { name: 'Project guide' });
  await panel.getByRole('button', { name: 'Turn the voice off' }).click();
  await panel.getByRole('button', { name: /Take me on the tour/i }).click();

  await expect(panel.getByText(/Tour ·/)).toBeVisible({ timeout: 20_000 });
  await panel.getByRole('textbox', { name: 'Your question' }).fill('kitne acre hai?');
  await panel.getByRole('button', { name: 'Send' }).click();

  await expect(panel.getByText(/Tour ·/)).toHaveCount(0, { timeout: 15_000 });
  const url = page.url();
  await page.waitForTimeout(12_000);
  console.log('STAYED PUT: ' + (page.url() === url));
  console.log('PANEL TAIL: ' + (await panel.innerText()).replace(/\s+/g, ' ').slice(-200));
});
