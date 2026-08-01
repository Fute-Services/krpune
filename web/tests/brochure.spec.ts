import { test, expect } from '@playwright/test';
import { login, url } from './helpers';

/**
 * The brochure button, and the overlay that once covered it.
 *
 * The install card shipped bottom-anchored on every route and landed exactly
 * on top of AboutUs's Corporate Profile / Walkthrough / Gallery stack. The
 * button still rendered and still had its handler; the taps just went to the
 * card instead. Nothing threw, nothing logged — the brochure simply never
 * opened. An "is the button on screen" assertion would have passed throughout,
 * so these tests assert that a real click reaches it and produces the PDF.
 */
test.describe('brochure', () => {
  test('the Corporate Profile button is not covered by any overlay', async ({ page }) => {
    await login(page);
    await page.goto(url('/aboutus'));
    // Long enough that the install card would have appeared, back when it did.
    await page.waitForTimeout(2500);

    const button = page.getByRole('button', { name: /Corporate Profile/i }).first();
    await expect(button).toBeVisible();

    // Whatever sits at the button's centre must be the button itself.
    const covering = await button.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!top) return 'nothing found at the button centre';
      return el.contains(top) || top.contains(el)
        ? null
        : `${top.tagName.toLowerCase()}${top.getAttribute('aria-label') ? `[${top.getAttribute('aria-label')}]` : ''}`;
    });
    expect(covering, `something is sitting on top of the brochure button: ${covering}`).toBeNull();
  });

  test('the home brochure modal offers a way out of the iframe', async ({ page }) => {
    // iOS Safari renders an iframed PDF as one unscrollable page, so on the
    // iPad this modal shows the cover and nothing else. "Open full screen"
    // hands the file to the OS viewer instead. It has to point at the PDF
    // itself — anything else silently reintroduces the same dead end.
    await login(page);
    await page.goto(url('/'));
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /Corporate Profile/i }).first().click();

    const open = page.getByRole('link', { name: /Open full screen/i });
    await expect(open, 'no full-screen escape hatch in the brochure modal').toBeVisible();
    await expect(open).toHaveAttribute('href', /\.pdf$/);
    await expect(open).toHaveAttribute('target', '_blank');

    // The embed stays for the platforms where it works.
    await expect(page.locator('.pdf-container iframe')).toHaveCount(1);
  });

  test('clicking it fetches the brochure PDF', async ({ page, context }) => {
    const pdfRequests: string[] = [];
    context.on('request', (r) => {
      if (r.url().endsWith('.pdf')) pdfRequests.push(r.url());
    });

    await login(page);
    await page.goto(url('/aboutus'));
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /Corporate Profile/i }).first().click();

    // The popup renders in a native PDF viewer that headless builds do not
    // ship, so asserting on the popup's contents proves nothing. The request
    // for the bytes is the real signal.
    await expect
      .poll(() => pdfRequests.length, {
        message: 'clicking Corporate Profile never requested the PDF',
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
  });

  test('the install card still appears on home, where the visitor lands', async ({ page }) => {
    await login(page);
    await page.goto(url('/'));
    await expect(
      page.getByRole('dialog', { name: 'Install this app' }),
      'restricting the card to home removed it everywhere — the install offer is gone',
    ).toBeVisible({ timeout: 10_000 });
  });

  test('the install card stays off the routes that have corner controls', async ({ page }) => {
    await login(page);

    for (const route of ['/aboutus', '/amenities', '/vr', '/gallery']) {
      await page.goto(url(route));
      await page.waitForTimeout(2000);
      await expect(
        page.getByRole('dialog', { name: 'Install this app' }),
        `the install card rendered on ${route}, where it can cover page controls`,
      ).toHaveCount(0);
    }
  });
});
