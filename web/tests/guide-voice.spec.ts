/**
 * The microphone, against the failure that actually happened.
 *
 * A visitor tapped the mic, said nothing, and the guide answered a question
 * they had never asked — "Terms & Cormac, Raheja, podium, terrace, and the",
 * which was Whisper reciting the domain prompt it had been given. The fix is
 * three-layered (don't send audio with no speech in it, drop low-confidence
 * transcripts, don't prime Whisper with a recitable list), and only a test that
 * feeds real silence in can tell whether it still holds.
 *
 * Audio is fed through Chrome's fake capture device, which needs a WAV on disk.
 * The room tone is generated here; the spoken question is committed under
 * tests/fixtures, because test-results/ is wiped before every run.
 */
import { test, expect, chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { login } from './helpers';

const FIXTURES = 'test-results/voice-fixtures';

/** 16 kHz mono PCM in a WAV wrapper — the only format the fake device takes. */
function writeWav(name: string, samples: Int16Array): string {
  mkdirSync(FIXTURES, { recursive: true });
  const path = join(FIXTURES, name);
  const pcm = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24);
  header.writeUInt32LE(32000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  writeFileSync(path, Buffer.concat([header, pcm]));
  return path;
}

/**
 * Ten seconds of an empty room: dither, not digital silence, because a real
 * microphone in a quiet room is never actually silent and digital silence would
 * be an easier test than reality.
 */
function roomTone(): string {
  const samples = new Int16Array(16000 * 10);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.round((Math.random() - 0.5) * 60);
  return writeWav('room-tone.wav', samples);
}

async function openWithMic(wav: string) {
  const browser = await chromium.launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${join(process.cwd(), wav)}`,
    ],
  });
  const context = await browser.newContext({
    baseURL: 'http://localhost:4173',
    permissions: ['microphone'],
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await login(page);
  const launcher = page.getByRole('button', { name: 'Ask the guide' });
  if ((await launcher.count()) === 0) {
    await browser.close();
    return null;
  }
  await launcher.click();
  return { browser, page, panel: page.getByRole('dialog', { name: 'Project guide' }) };
}

test('an empty room never becomes a question', async () => {
  test.setTimeout(180_000);
  const session = await openWithMic(roomTone());
  test.skip(session === null, 'no guide key in this build');
  const { browser, panel } = session!;

  try {
    await panel.getByRole('button', { name: 'Speak' }).click();

    // It says so rather than sitting silent, and — the actual regression —
    // nothing is sent to be answered.
    await expect(panel.getByText(/didn.t catch that/i)).toBeVisible({ timeout: 60_000 });

    const transcript = (await panel.innerText()).replace(/\s+/g, ' ');
    expect(transcript, 'Whisper recited its own prompt back as a question').not.toMatch(
      /Terms[:&]|Cormac|podium, terrace, and/i,
    );
    // A user message at all would mean silence was treated as speech. The
    // suggestion chips are buttons, not messages, so this is specific.
    const asked = await panel.locator('p.rounded-2xl').count();
    expect(asked, 'silence was sent as a question').toBe(0);
  } finally {
    await browser.close();
  }
});

/**
 * The other half of the same guard: tightening the microphone must not have
 * made it deaf. Uses tests/fixtures/spoken-question.wav
 * — a recording of someone asking about the podium amenities, trailed by
 * silence so the recorder hears them stop.
 */
test('a real question still gets through', async () => {
  test.setTimeout(180_000);
  // Committed, not generated: it lives outside test-results/, which Playwright
  // wipes before every run.
  const spoken = 'tests/fixtures/spoken-question.wav';
  test.skip(!existsSync(spoken), 'no spoken fixture at ' + spoken);

  const session = await openWithMic(spoken);
  test.skip(session === null, 'no guide key in this build');
  const { browser, page, panel } = session!;

  try {
    await panel.getByRole('button', { name: 'Speak' }).click();
    await expect(panel.locator('p.rounded-2xl')).toHaveCount(1, { timeout: 60_000 });
    await page.waitForTimeout(20_000);
    console.log('HEARD + ANSWERED: ' + (await panel.innerText()).replace(/\s+/g, ' ').slice(-300));
  } finally {
    await browser.close();
  }
});
