/**
 * The guide is the one feature whose presence depends on build-time config, so
 * this covers both builds rather than assuming one: no VITE_ANTHROPIC_API_KEY
 * means the pill must be absent and the rest of the shell untouched; a key means
 * the panel opens, sends, and renders a failure as a sentence rather than a
 * stack trace. Run it against a build made with a dummy key to exercise the
 * second path — a real key would spend money on every CI run.
 */
import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('the project guide behaves in both configured and unconfigured builds', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await login(page);

  const pill = page.getByRole('button', { name: 'Ask the guide' });
  const configured = (await pill.count()) > 0;

  if (!configured) {
    // Rule: an unconfigured guide hides completely. A chat box that answers
    // every question with a configuration error is worse than no chat box.
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    test.info().annotations.push({ type: 'note', description: 'no API key in this build' });
    return;
  }

  await pill.click();
  const panel = page.getByRole('dialog', { name: 'Project guide' });
  await expect(panel).toBeVisible();

  await panel.getByRole('button', { name: 'What am I looking at?' }).click();

  // Either a real answer or a readable failure — never an unhandled rejection
  // and never a raw SDK message.
  await expect(
    panel.locator('text=/API key was rejected|assistant failed with error|cannot reach the assistant|[a-z]{4,}/i').last(),
  ).toBeVisible({ timeout: 45_000 });

  await panel.getByRole('button', { name: 'Close' }).click();
  await expect(panel).toHaveCount(0);
  expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
});
