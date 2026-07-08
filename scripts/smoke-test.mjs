// Automated crash / click / offline smoke test for the packaged Electron app.
// Launches the real Electron app, sweeps every route, records JS errors, page
// crashes, broken images and video load errors, screenshots each page, then
// stress-clicks buttons to ensure nothing crashes. Run: node scripts/smoke-test.mjs
import { _electron as electron } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SHOTS = process.env.SHOTS || path.resolve('test-shots');

// Videos the user still has to supply — their load errors are EXPECTED, not bugs.
const EXPECTED_MISSING = ['walkthrough.mp4', 'construction.mp4', 'circulation.mp4'];

const routes = [
  '/', '/location', '/vr', '/construction', '/blueprint', '/amenities',
  '/project_details', '/mobility', '/vertical-transport', '/aboutus',
  '/walkthrough', '/gallery', '/overview', '/sustainability', '/concept_summary',
  '/unitplan/17', '/projectinfo', '/terrace-level', '/podium-level',
  '/ground-level', '/lobby-reception', '/fitout-plan', '/circulation-plan',
];

let cur = '/';
const errors = [];

const app = await electron.launch({ args: ['.'] });
const page = await app.firstWindow();
page.on('console', (m) => { if (m.type() === 'error') errors.push({ route: cur, msg: m.text() }); });
page.on('pageerror', (e) => errors.push({ route: cur, msg: 'PAGEERROR: ' + e.message }));
page.on('crash', () => errors.push({ route: cur, msg: '*** RENDERER CRASHED ***' }));

await mkdir(SHOTS, { recursive: true });
await page.waitForTimeout(2000);

const report = [];

// ---- PASS 1: route sweep ----
console.log('=== PASS 1: route sweep ===');
for (const r of routes) {
  cur = r;
  const before = errors.length;
  try {
    await page.evaluate((h) => { window.location.hash = '#' + h; }, r);
    await page.waitForTimeout(1400);
    const info = await page.evaluate(() => {
      const brokenImgs = [];
      document.querySelectorAll('img').forEach((im) => {
        if ((im.src || im.currentSrc) && im.complete && im.naturalWidth === 0) brokenImgs.push(im.currentSrc || im.src);
      });
      const videos = [];
      document.querySelectorAll('video').forEach((v) => videos.push({ src: v.currentSrc || v.src, err: v.error ? v.error.code : null }));
      const clickable = document.querySelectorAll('button, a, [role=button]').length;
      const bodyText = (document.body.innerText || '').trim().length;
      return { brokenImgs, videos, clickable, bodyText };
    });
    const shot = path.join(SHOTS, r.replace(/[^a-z0-9]/gi, '_') + '.png');
    await page.screenshot({ path: shot });
    const newErrs = errors.slice(before).map((e) => e.msg);
    const badVids = info.videos.filter((v) => v.err && !EXPECTED_MISSING.some((n) => (v.src || '').includes(n)));
    report.push({ route: r, ...info, newErrs, badVids });
    const flag = newErrs.length || info.brokenImgs.length || badVids.length ? 'WARN' : 'ok';
    console.log(`[${flag}] ${r}  imgsBroken=${info.brokenImgs.length} vidErr=${badVids.length} jsErr=${newErrs.length} clickable=${info.clickable}`);
  } catch (e) {
    report.push({ route: r, fatal: e.message });
    console.log(`[FATAL] ${r}  ${e.message}`);
  }
}

// ---- PASS 2: click stress on interactive pages ----
console.log('\n=== PASS 2: click stress ===');
const clickRoutes = ['/', '/project_details', '/amenities', '/gallery', '/overview', '/location'];
let clicks = 0, clickErrs = 0;
for (const r of clickRoutes) {
  cur = r;
  const n = await (async () => {
    await page.evaluate((h) => { window.location.hash = '#' + h; }, r);
    await page.waitForTimeout(1000);
    return page.locator('button, [role=button]').count();
  })();
  const cap = Math.min(n, 10);
  for (let i = 0; i < cap; i++) {
    const before = errors.length;
    try {
      await page.evaluate((h) => { window.location.hash = '#' + h; }, r); // reset to route
      await page.waitForTimeout(500);
      const btn = page.locator('button, [role=button]').nth(i);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ timeout: 2000, force: true }).catch(() => {});
        clicks++;
        await page.waitForTimeout(400);
      }
    } catch { /* ignore */ }
    if (errors.length > before) clickErrs += errors.length - before;
  }
  console.log(`  ${r}: clicked up to ${cap} buttons`);
}

await app.close();

// ---- SUMMARY ----
console.log('\n================ SUMMARY ================');
const issues = report.filter((x) => x.fatal || x.newErrs?.length || x.brokenImgs?.length || x.badVids?.length);
console.log(`routes: ${report.length} | with issues: ${issues.length} | clicks: ${clicks} | click-triggered errors: ${clickErrs}`);
const blank = report.filter((x) => !x.fatal && (x.bodyText || 0) < 5);
if (blank.length) console.log(`possibly BLANK pages: ${blank.map((b) => b.route).join(', ')}`);
for (const x of report) {
  if (x.fatal) { console.log(`  FATAL ${x.route}: ${x.fatal}`); continue; }
  if (x.brokenImgs?.length) console.log(`  IMG  ${x.route}: ${x.brokenImgs.length} broken -> ${x.brokenImgs.slice(0, 2).map((s) => s.split('/').pop()).join(', ')}`);
  if (x.badVids?.length) console.log(`  VID  ${x.route}: ${x.badVids.map((v) => 'code' + v.err + ' ' + (v.src || '').split('/').pop()).join(', ')}`);
  if (x.newErrs?.length) console.log(`  JS   ${x.route}: ${x.newErrs.slice(0, 2).join(' || ').slice(0, 240)}`);
}
console.log('\nExpected-missing videos (user will supply):', EXPECTED_MISSING.join(', '));
console.log('screenshots:', SHOTS);
