/**
 * The guided tour, driven end to end.
 *
 * Run against a build with a guide key; without one the launcher is absent and
 * these skip themselves.
 *
 * The first test deliberately lets two stops run at their real pace before
 * skipping through the rest: the pacing is the feature — a tour that flicks
 * through nineteen screens in ninety seconds is the bug this was written
 * against — and skipping the whole way would prove only that navigation works.
 */
import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { minimumStopMs, TOUR } from '../src/chatbot/tour';

async function openGuide(page: import('@playwright/test').Page) {
  await login(page);
  const launcher = page.getByRole('button', { name: 'Ask the guide' });
  test.skip((await launcher.count()) === 0, 'no guide key in this build');
  await launcher.click();
  return page.getByRole('dialog', { name: 'Project guide' });
}

function atRoute(path: string): RegExp {
  return new RegExp(`#${path.replace(/\//g, '\\/')}$`);
}

test('the tour visits every stop in order, and holds each one long enough to read', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  const panel = await openGuide(page);
  // Muted: no audio in a headless browser, so the stop's own floor is what
  // paces it — which is exactly the path worth testing, since it is also what
  // runs on a device whose speakers are off or whose voice request failed.
  await panel.getByRole('button', { name: 'Turn the voice off' }).click();
  await panel.getByRole('button', { name: /Take me on the tour/i }).click();

  await expect(page).toHaveURL(atRoute(TOUR[0].path), { timeout: 30_000 });

  // Two stops at full pace.
  for (let i = 1; i < 3; i += 1) {
    const startedAt = Date.now();
    await expect(page).toHaveURL(atRoute(TOUR[i].path), { timeout: 90_000 });
    const held = Date.now() - startedAt;
    const floor = minimumStopMs(TOUR[i - 1].line);
    console.log(`held ${TOUR[i - 1].path} for ${(held / 1000).toFixed(1)}s (floor ${(floor / 1000).toFixed(1)}s)`);
    expect(held, `${TOUR[i - 1].path} was rushed past`).toBeGreaterThan(floor * 0.9);
  }

  // The rest by skipping, which is the visitor's own escape hatch.
  for (let i = 3; i < TOUR.length; i += 1) {
    await panel.getByRole('button', { name: 'Skip' }).click();
    await expect(page, `tour never reached ${TOUR[i].path}`).toHaveURL(atRoute(TOUR[i].path), {
      timeout: 30_000,
    });
  }

  // Skipping the last stop ends it rather than looping or stalling.
  await panel.getByRole('button', { name: 'Skip' }).click();
  await expect(panel.getByText(/Tour ·/)).toHaveCount(0, { timeout: 15_000 });
  expect(errors, errors.join(' | ')).toEqual([]);
});

test('asking a question mid-tour stops the tour', async ({ page }) => {
  test.setTimeout(180_000);
  const panel = await openGuide(page);
  await panel.getByRole('button', { name: 'Turn the voice off' }).click();
  await panel.getByRole('button', { name: /Take me on the tour/i }).click();

  await expect(panel.getByText(/Tour ·/)).toBeVisible({ timeout: 20_000 });
  await panel.getByRole('textbox', { name: 'Your question' }).fill('kitne acre hai?');
  await panel.getByRole('button', { name: 'Send' }).click();

  await expect(panel.getByText(/Tour ·/)).toHaveCount(0, { timeout: 15_000 });

  // The tour must not resume — but the guide is still free to navigate on its
  // own: answering "kitne acre hai?" by opening Project Info, the screen that
  // says nine acres, is the feature working. So this checks that the next
  // stop's narration never arrives, not that the app stayed still. An earlier
  // version asserted the URL was unchanged and failed on a correct answer.
  const nextStopOpening = TOUR[1].line.slice(0, 16);
  await page.waitForTimeout(12_000);
  expect(
    (await panel.innerText()).replace(/\s+/g, ' '),
    'the tour carried on narrating after it was interrupted',
  ).not.toContain(nextStopOpening);
  console.log('PANEL TAIL: ' + (await panel.innerText()).replace(/\s+/g, ' ').slice(-180));
});
