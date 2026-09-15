/**
 * The four quick wins, each against the behaviour it exists for.
 *
 * Every network call the guide makes is replaced in the page, so these run
 * against any build with a key, cost nothing, and do not depend on what a
 * model happens to say that day:
 *
 *   prepared answers   the question never reaches the model
 *   spoken as written  the first sentence is sent to the voice before the
 *                      model has finished writing the reply
 *   interrupting       a tap on the mic while the guide talks stops it and
 *                      opens exactly one recorder
 *   next visitor       an idle conversation is cleared
 *
 * Talking over the guide is judged by a pure function (bargeIn.ts), tested
 * here on loudness traces. What cannot be tested headless is a real speaker
 * feeding a real microphone — that needs checking on the kiosk itself.
 */
import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { login } from './helpers';
import { createBargeInDetector } from '../src/chatbot/bargeIn';
import { nextSpeakable } from '../src/chatbot/speechChunks';
import { matchFaq } from '../src/chatbot/faq';

/* ── Pure logic ─────────────────────────────────────────────────────────── */

/** Deterministic noise, so a failing trace fails the same way every time. */
function noise(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s / 2147483647 - 0.5) * 2;
  };
}

/**
 * Playback loudness shaped like speech: words of ~250 ms, short gaps between
 * them, and a longer pause every few words where a sentence ends.
 */
function speechLikePlayback(ms: number, tick = 60): number[] {
  const out: number[] = [];
  const rnd = noise(3);
  let t = 0;
  let word = 0;
  while (t < ms) {
    const isSentenceEnd = word % 7 === 6;
    const wordMs = 220 + Math.round(Math.abs(rnd()) * 80);
    const gapMs = isSentenceEnd ? 650 : 90;
    for (let i = 0; i < wordMs / tick && t < ms; i += 1, t += tick) out.push(0.15 + Math.abs(rnd()) * 0.1);
    for (let i = 0; i < gapMs / tick && t < ms; i += 1, t += tick) out.push(0.002);
    word += 1;
  }
  return out;
}

/** Runs a trace; returns when (ms) the detector fired, or null. */
function run(playback: number[], micAt: (i: number, echo: number) => number, tick = 60): number | null {
  const detector = createBargeInDetector();
  const rnd = noise(11);
  for (let i = 0; i < playback.length; i += 1) {
    // Echo arrives a tick late and at about a third of the playback level.
    const echo = 0.35 * (playback[i - 1] ?? 0);
    const mic = Math.max(0, micAt(i, echo) + Math.abs(rnd()) * 0.003);
    if (detector.push(mic, playback[i], tick)) return i * tick;
  }
  return null;
}

test.describe('talking over the guide (detector)', () => {
  const playback = speechLikePlayback(12_000);

  test('the guide’s own echo never interrupts it', () => {
    expect(run(playback, (_, echo) => echo)).toBeNull();
  });

  test('a visitor who starts talking is heard within a sentence', () => {
    const startsAt = 4000;
    const fired = run(playback, (i, echo) => echo + (i * 60 >= startsAt ? 0.09 : 0));
    expect(fired, 'never noticed the visitor').not.toBeNull();
    expect(fired!).toBeGreaterThanOrEqual(startsAt);
    expect(fired!, 'took longer than a sentence to notice').toBeLessThan(startsAt + 3500);
  });

  test('someone talking nearby the whole time does not count', () => {
    expect(run(playback, (_, echo) => echo + 0.05)).toBeNull();
  });

  test('talking only while it was calibrating does not trigger later', () => {
    expect(run(playback, (i, echo) => echo + (i * 60 < 800 ? 0.09 : 0))).toBeNull();
  });

  test('a cough is too short', () => {
    expect(run(playback, (i, echo) => echo + (i * 60 >= 5000 && i * 60 < 5180 ? 0.2 : 0))).toBeNull();
  });
});

test.describe('cutting a reply into sentences as it arrives', () => {
  test('a finished sentence is released once the next one begins', () => {
    expect(nextSpeakable('Pune Airport is 17 kilometres away', 0, false).chunks).toEqual([]);
    const { chunks, to } = nextSpeakable('Pune Airport is 17 kilometres away. It', 0, false);
    expect(chunks).toEqual(['Pune Airport is 17 kilometres away.']);
    expect(nextSpeakable('Pune Airport is 17 kilometres away. It takes 40 minutes.', to, true).chunks).toEqual([
      'It takes 40 minutes.',
    ]);
  });

  test('decimals and abbreviations stay whole', () => {
    const text = 'It has roughly 2.7 million square feet, approx. 17 floors of space. Next';
    expect(nextSpeakable(text, 0, false).chunks).toEqual([
      'It has roughly 2.7 million square feet, approx. 17 floors of space.',
    ]);
  });

  test('short sentences are joined to the next', () => {
    const { chunks } = nextSpeakable('Yes. The project is LEED Gold certified for Core and Shell. Want', 0, false);
    expect(chunks).toEqual(['Yes. The project is LEED Gold certified for Core and Shell.']);
  });

  test('Devanagari sentences split on the danda', () => {
    const { chunks } = nextSpeakable('पार्किंग के 8 लेवल हैं, लोअर ग्राउंड से छठे पोडियम तक। क्या', 0, false);
    expect(chunks).toEqual(['पार्किंग के 8 लेवल हैं, लोअर ग्राउंड से छठे पोडियम तक।']);
  });
});

test.describe('prepared answers (matching)', () => {
  const hit = (q: string) => matchFaq(q, [])?.id ?? null;
  const lang = (q: string) => matchFaq(q, [])?.language ?? null;

  test('the everyday questions match, in all three languages', () => {
    expect(hit('airport kitna door hai?')).toBe('airport');
    expect(lang('airport kitna door hai?')).toBe('hinglish');
    expect(hit('How far is the airport?')).toBe('airport');
    expect(lang('How far is the airport?')).toBe('english');
    expect(hit('एयरपोर्ट कितनी दूर है?')).toBe('airport');
    expect(lang('एयरपोर्ट कितनी दूर है?')).toBe('devanagari');
    expect(hit('railway station kitna door hai')).toBe('station');
    expect(hit('kitne acre ka project hai?')).toBe('size');
    expect(hit('पार्किंग कितने लेवल की है?')).toBe('parking');
    expect(hit('Is it LEED certified?')).toBe('leed');
    expect(hit('How many towers are there?')).toBe('towers');
    expect(hit('food court kitna bada hai')).toBe('foodcourt');
    expect(hit('Who is the developer?')).toBe('developer');
    expect(hit('yeh project kahan hai?')).toBe('where');
  });

  test('near misses go to the model instead', () => {
    // Each of these would get a confidently wrong prepared answer.
    expect(hit('10th floor ka carpet area kitna hai?')).toBeNull();
    expect(hit('metro station kitna door hai')).toBeNull();
    expect(hit('open the parking booking screen')).toBeNull();
    expect(hit('how many cars can park')).toBeNull();
    expect(hit('terrace food court kahan hai')).toBeNull();
    // Not a miss: the food court answer says where it is (the podium, and a
    // second on the terrace). What must not happen is the *location of the
    // project* being given for it.
    expect(hit('where is the food court?')).toBe('foodcourt');
    expect(hit('where is the lift lobby?')).toBeNull();
    expect(hit('airport kahan hai?')).toBeNull();
    expect(hit('airport kitna door hai aur rent kitna hai?')).toBeNull();
    expect(hit('what water saving features does the green building have')).toBeNull();
    expect(hit('can you tell me in detail how far the airport is from this project and how to reach')).toBeNull();
  });

  test('a short follow-up keeps the language of the conversation', () => {
    expect(matchFaq('Airport?', [{ role: 'user', content: 'mujhe location ke baare mein batao' }])).toBeNull();
    const followUp = matchFaq('airport distance?', [{ role: 'user', content: 'project kahan hai bataiye' }]);
    expect(followUp?.language).toBe('hinglish');
  });
});

/* ── In the app, with the network replaced ──────────────────────────────── */

/** A WAV of quiet tone, so playback has something to meter and a real length. */
function toneWavBase64(ms: number): string {
  const rate = 16000;
  const samples = Math.round((rate * ms) / 1000);
  const pcm = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i += 1) pcm.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 220) * 1500), i * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString('base64');
}

/**
 * Replaces the guide's network in the page: the model streams a three-sentence
 * reply slowly, every voice request returns a WAV, Whisper hears nothing.
 * Everything is logged with a timestamp on window.__guideLog.
 */
function mockGuideNetwork(options: { ttsMs: number; sentenceGapMs: number }) {
  return `(() => {
    const wav = Uint8Array.from(atob('${toneWavBase64(options.ttsMs)}'), (c) => c.charCodeAt(0));
    const log = (window.__guideLog = []);
    const mark = (what) => log.push({ t: performance.now(), what });
    window.__recorders = 0;
    const RealRecorder = window.MediaRecorder;
    if (RealRecorder) {
      window.MediaRecorder = class extends RealRecorder {
        constructor(...args) { super(...args); window.__recorders += 1; }
      };
    }
    const realFetch = window.fetch.bind(window);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    window.fetch = async (input, init) => {
      const url = String(input && input.url ? input.url : input);
      if (url.includes('/chat/completions')) {
        mark('chat:start');
        const enc = new TextEncoder();
        const parts = [
          'The podium level has a large food court. ',
          'It opens onto a landscaped garden. ',
          'Would you like to see the podium plan?',
        ];
        const body = new ReadableStream({
          async start(controller) {
            for (const [i, text] of parts.entries()) {
              if (i > 0) await sleep(${options.sentenceGapMs});
              controller.enqueue(enc.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\\n\\n'));
            }
            await sleep(200);
            controller.enqueue(enc.encode('data: [DONE]\\n\\n'));
            mark('chat:end');
            controller.close();
          },
        });
        return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
      }
      if (url.includes('api.elevenlabs.io') || url.includes('/audio/speech')) {
        const sent = JSON.parse(init.body);
        mark('tts:' + (sent.text || sent.input));
        return new Response(new Blob([wav], { type: 'audio/wav' }), { status: 200 });
      }
      if (url.includes('/audio/transcriptions')) {
        mark('stt');
        return new Response(JSON.stringify({ text: '', segments: [] }), { status: 200 });
      }
      return realFetch(input, init);
    };
  })();`;
}

async function openGuide(page: Page) {
  await login(page);
  const launcher = page.getByRole('button', { name: 'Ask the guide' });
  test.skip((await launcher.count()) === 0, 'no guide key in this build');
  await launcher.click();
  return page.getByRole('dialog', { name: 'Project guide' });
}

async function ask(panel: ReturnType<Page['getByRole']>, question: string) {
  await panel.getByRole('textbox', { name: 'Your question' }).fill(question);
  await panel.getByRole('button', { name: 'Send' }).click();
}

test('a prepared answer is instant and never reaches the model', async ({ page }) => {
  const modelCalls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/chat/completions')) modelCalls.push(r.url());
  });

  const panel = await openGuide(page);
  await panel.getByRole('button', { name: 'Turn the voice off' }).click();
  await ask(panel, 'airport kitna door hai?');
  // Timed from the send, not from before typing: filling the box and waiting
  // for Send to be clickable are Playwright's time, not the guide's.
  const sent = Date.now();

  await expect(panel.getByText(/17 kilometre door hai/)).toBeVisible({ timeout: 3000 });
  expect(Date.now() - sent, 'a prepared answer should not wait on anything').toBeLessThan(1500);
  await page.waitForTimeout(1500);
  expect(modelCalls, 'the prepared question was sent to the model anyway').toEqual([]);
});

test('the first sentence is voiced before the model has finished the reply', async ({ page }) => {
  await page.addInitScript(mockGuideNetwork({ ttsMs: 500, sentenceGapMs: 1500 }));
  const panel = await openGuide(page);
  await ask(panel, 'Tell me about the podium level');

  await expect(panel.getByText(/podium plan\?/)).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => (window as any).__guideLog.filter((e: any) => e.what.startsWith('tts:')).length), { timeout: 15_000 }).toBe(3);

  const log: { t: number; what: string }[] = await page.evaluate(() => (window as any).__guideLog);
  const firstVoice = log.find((e) => e.what.startsWith('tts:'))!;
  const chatEnd = log.find((e) => e.what === 'chat:end')!;
  console.log('VOICE ORDER: ' + log.map((e) => `${Math.round(e.t)} ${e.what}`).join(' | '));

  expect(firstVoice.what).toBe('tts:The podium level has a large food court.');
  expect(firstVoice.t, 'the voice waited for the whole reply').toBeLessThan(chatEnd.t - 1000);
  expect(log.filter((e) => e.what.startsWith('tts:')).map((e) => e.what)).toEqual([
    'tts:The podium level has a large food court.',
    'tts:It opens onto a landscaped garden.',
    'tts:Would you like to see the podium plan?',
  ]);
});

test('tapping the mic while the guide talks stops it and opens exactly one recorder', async () => {
  test.setTimeout(120_000);
  const fixtures = 'test-results/voice-fixtures';
  mkdirSync(fixtures, { recursive: true });
  const room = join(fixtures, 'quickwins-room.wav');
  writeFileSync(room, Buffer.from(toneWavBase64(1), 'base64').subarray(0, 44)); // placeholder header, replaced below
  // Ten seconds of quiet room tone for the fake microphone.
  const rate = 16000;
  const pcm = Buffer.alloc(rate * 10 * 2);
  for (let i = 0; i < rate * 10; i += 1) pcm.writeInt16LE(Math.round((Math.random() - 0.5) * 60), i * 2);
  const header = Buffer.from(toneWavBase64(1), 'base64').subarray(0, 44);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.writeUInt32LE(pcm.length, 40);
  writeFileSync(room, Buffer.concat([header, pcm]));

  const browser = await chromium.launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${join(process.cwd(), room)}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  try {
    const context = await browser.newContext({
      baseURL: 'http://localhost:4173',
      permissions: ['microphone'],
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.addInitScript(mockGuideNetwork({ ttsMs: 8000, sentenceGapMs: 50 }));
    const panel = await openGuide(page);

    await ask(panel, 'Tell me about the podium level');
    await expect(panel.getByText('Speaking…')).toBeVisible({ timeout: 15_000 });

    await panel.getByRole('button', { name: 'Speak' }).click();
    await expect(panel.getByText("Go ahead, I'm listening")).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText('Speaking…')).toHaveCount(0);

    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as any).__recorders), 'more than one recorder was opened').toBe(1);
  } finally {
    await browser.close();
  }
});

test('an idle conversation is cleared for the next visitor', async ({ page }) => {
  // The guide's own log lines: the reset announces itself.
  const guideLog: string[] = [];
  page.on('console', (m) => {
    if (m.text().startsWith('[guide]')) guideLog.push(m.text());
  });
  await page.clock.install();
  const panel = await openGuide(page);
  await panel.getByRole('button', { name: 'Turn the voice off' }).click();
  await ask(panel, 'airport kitna door hai?');
  await expect(panel.getByText(/17 kilometre door hai/)).toBeVisible();

  // Closed for less than a minute: still there when reopened.
  await panel.getByRole('button', { name: 'Close' }).click();
  await page.clock.fastForward(30_000);
  await page.getByRole('button', { name: 'Ask the guide' }).click();
  await expect(panel.getByText(/17 kilometre door hai/)).toBeVisible();

  // Closed for over a minute: gone.
  await panel.getByRole('button', { name: 'Close' }).click();
  await page.clock.fastForward(66_000);
  await page.getByRole('button', { name: 'Ask the guide' }).click();
  await expect(panel.getByRole('button', { name: /Take me on the tour/ })).toBeVisible();
  await expect(panel.getByText(/17 kilometre door hai/)).toHaveCount(0);

  // Left open and untouched for over two minutes: closed and cleared. The reset
  // turned the voice back on for the next visitor, so it is muted again: this
  // is about idleness, and a voice still talking is rightly never idle.
  await panel.getByRole('button', { name: 'Turn the voice off' }).click();
  await ask(panel, 'airport kitna door hai?');
  await expect(panel.getByText(/17 kilometre door hai/)).toBeVisible();
  const resetsBefore = guideLog.filter((l) => l.includes('idle — clearing')).length;
  await page.clock.fastForward(126_000);
  await expect
    .poll(() => guideLog.filter((l) => l.includes('idle — clearing')).length, { timeout: 10_000 })
    .toBe(resetsBefore + 1);
  // Closed: the launcher is back. Not asserted through the dialog leaving the
  // DOM — framer-motion's exit animation does not finish under Playwright's
  // fake clock, so the closing panel lingers in the DOM here though not in the
  // app (chatbot.spec checks that on a real clock). That it comes back empty
  // is the check above, after the closed-panel reset.
  await expect(page.getByRole('button', { name: 'Ask the guide' })).toBeVisible();
});
