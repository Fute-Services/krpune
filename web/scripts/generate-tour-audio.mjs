/**
 * Renders the guide's fixed lines to audio files, once, ahead of time: the
 * guided tour's narration, and the prepared answers to the questions every
 * visitor asks (src/chatbot/faqAnswers.json).
 *
 * This exists because the tour was buying its own voice again on every single
 * run. The narration is nineteen fixed lines, about 6,000 characters; an
 * ElevenLabs free tier is 10,000 credits and the flash model spends half a
 * credit a character, so roughly three runs of the tour emptied the account and
 * the kiosk quietly dropped to the robotic browser voice. Paying for the same
 * unchanging sentences over and over was the actual bug. The prepared answers
 * are the same situation: "airport kitna door hai?" is asked all day.
 *
 * Rendered once, the clips are static files: they cost nothing to play, they
 * work with the network off like the rest of this app, and the guide keeps the
 * good voice whatever the account balance is afterwards.
 *
 * Usage:
 *   npm run tour:audio              # render anything missing, tour and answers
 *   npm run tour:audio -- --force   # re-render everything (after editing lines)
 *   npm run faq:audio               # only the prepared answers
 *
 * Needs VITE_ELEVENLABS_API_KEY (preferred) or VITE_GROQ_API_KEY in web/.env.
 * Existing files are left alone, so a run that dies halfway can be repeated
 * without paying for the clips that already landed.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ELEVEN_MODEL = 'eleven_flash_v2_5';
const ELEVEN_VOICE = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
const GROQ_MODEL = 'canopylabs/orpheus-v1-english';
const GROQ_VOICE = 'Autumn';
const GROQ_LIMIT = 200;

const force = process.argv.includes('--force');
const faqOnly = process.argv.includes('--faq-only');
const tourOnly = process.argv.includes('--tour-only');

function env(name) {
  const line = existsSync(join(root, '.env'))
    ? readFileSync(join(root, '.env'), 'utf8')
        .split('\n')
        .find((l) => l.startsWith(`${name}=`))
    : null;
  return process.env[name] || (line ? line.slice(name.length + 1).trim() : '');
}

/**
 * The narration, read out of tour.ts rather than duplicated here — a second
 * copy of these lines would drift from the one the app speaks, and the whole
 * point is that the audio matches the text on screen.
 */
function readTour() {
  const source = readFileSync(join(root, 'src', 'chatbot', 'tour.ts'), 'utf8');
  const body = source.slice(source.indexOf('export const TOUR'), source.indexOf('\n];', source.indexOf('export const TOUR')));
  const stops = [];
  const re = /path:\s*'([^']+)',\s*\n\s*line:\s*(['"`])([\s\S]*?)\2,/g;
  for (let m = re.exec(body); m; m = re.exec(body)) {
    stops.push({ path: m[1], line: m[3].replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))) });
  }
  return stops;
}

/** The prepared answers — the same file the app answers from. */
function readAnswers() {
  const answers = JSON.parse(readFileSync(join(root, 'src', 'chatbot', 'faqAnswers.json'), 'utf8'));
  return Object.entries(answers).flatMap(([id, byLanguage]) =>
    Object.entries(byLanguage).map(([language, line]) => ({ id, language, line })),
  );
}

async function viaElevenLabs(key, text) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: ELEVEN_MODEL }),
  });
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return { buffer: Buffer.from(await response.arrayBuffer()), ext: 'mp3' };
}

/** Orpheus caps a request at 200 characters, so long lines arrive in pieces. */
function split(text, limit = GROQ_LIMIT) {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const pieces = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length <= limit) current += sentence;
    else {
      if (current.trim()) pieces.push(current.trim());
      current = sentence;
    }
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

/** Concatenates WAVs by keeping the first header and appending the PCM. */
function joinWavs(buffers) {
  if (buffers.length === 1) return buffers[0];
  const bodies = buffers.map((b) => b.subarray(44));
  const total = bodies.reduce((n, b) => n + b.length, 0);
  const header = Buffer.from(buffers[0].subarray(0, 44));
  header.writeUInt32LE(36 + total, 4);
  header.writeUInt32LE(total, 40);
  return Buffer.concat([header, ...bodies]);
}

async function viaGroq(key, text) {
  const clips = [];
  for (const piece of split(text)) {
    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GROQ_MODEL, input: piece, voice: GROQ_VOICE, response_format: 'wav' }),
    });
    if (!response.ok) throw new Error(`Groq ${response.status}: ${(await response.text()).slice(0, 200)}`);
    clips.push(Buffer.from(await response.arrayBuffer()));
  }
  return { buffer: joinWavs(clips), ext: 'wav' };
}

const eleven = env('VITE_ELEVENLABS_API_KEY');
const groq = env('VITE_GROQ_API_KEY');
if (!eleven && !groq) {
  console.error('No VITE_ELEVENLABS_API_KEY or VITE_GROQ_API_KEY in web/.env — nothing to render with.');
  process.exit(1);
}

/** Shared across both sets: a provider that failed once is not asked again. */
let failure = null;

/**
 * Renders one set of lines. `items` carry `key` (the index entry the app looks
 * up), `name` (the file name, without extension) and `line`.
 */
async function renderSet({ label, items, dir, indexFile, publicPrefix }) {
  const outDir = join(root, 'public', 'media', dir);
  mkdirSync(outDir, { recursive: true });

  const characters = items.reduce((n, item) => n + item.line.length, 0);
  console.log(`\n${label}: ${items.length} lines, ${characters} characters.`);
  console.log(`ElevenLabs spends about ${Math.round(characters / 2)} credits on these; it is a one-off.`);

  const index = {};
  let rendered = 0;
  let stopped = false;

  for (const item of items) {
    const existing = ['mp3', 'wav'].find((ext) => existsSync(join(outDir, `${item.name}.${ext}`)));
    if (existing && !force) {
      index[item.key] = `${publicPrefix}/${item.name}.${existing}`;
      console.log(`  ${item.name} — already rendered`);
      continue;
    }
    if (stopped) continue;

    // Orpheus is English-only; a Devanagari line read by it would be gibberish.
    // Without ElevenLabs such a line is simply spoken live by the app instead.
    const groqCanReadIt = !/[ऀ-ॿ]/.test(item.line);

    // Groq, unless it has already refused: unaccepted terms or a bad key say
    // the same thing for every line, and asking again just prints it again.
    const tryGroq = (error) => {
      if (!groq || !groqCanReadIt || failure?.groq) throw error;
      return viaGroq(groq, item.line).catch((groqError) => {
        failure = { ...failure, groq: groqError };
        throw groqError;
      });
    };

    try {
      let result;
      if (eleven && !failure?.eleven) {
        result = await viaElevenLabs(eleven, item.line).catch((error) => {
          failure = { ...failure, eleven: error };
          console.log(`     ElevenLabs unavailable (${error.message.slice(0, 120)})`);
          return tryGroq(error);
        });
      } else if (groq && groqCanReadIt && !failure?.groq) {
        result = await tryGroq(new Error('no ElevenLabs'));
      } else {
        const why = groqCanReadIt ? 'no voice account is usable' : 'Devanagari needs ElevenLabs';
        console.log(`  ${item.name} — skipped: ${why}; the app will speak it live`);
        continue;
      }

      writeFileSync(join(outDir, `${item.name}.${result.ext}`), result.buffer);
      index[item.key] = `${publicPrefix}/${item.name}.${result.ext}`;
      rendered += 1;
      console.log(`  ${item.name} — ${(result.buffer.length / 1024).toFixed(0)} KB`);
    } catch (error) {
      console.error(`  ${item.name} — FAILED: ${error.message}`);
      // A rejected key, an empty quota or unaccepted model terms will say exactly
      // the same thing for every remaining line. Stop and say what to do once.
      if (/terms|quota|401|403|429/i.test(error.message) && !(groq && failure?.eleven && groqCanReadIt)) {
        console.error('\nNothing more can be rendered until the voice account is usable. One of:');
        console.error('  • ElevenLabs — top up or wait for the monthly reset, then run this again.');
        console.error('  • Groq — accept the model terms once, then run this again:');
        console.error('    https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english');
        console.error('\nThe guide still works meanwhile; it speaks these lines live instead.');
        stopped = true;
      }
    }
  }

  // Written even when incomplete: the app falls back to speaking any line that
  // is not in here, so a partial render still helps rather than breaking.
  writeFileSync(join(root, indexFile), JSON.stringify(index, null, 2) + '\n');

  const bytes = Object.values(index)
    .map((url) => join(root, 'public', url))
    .filter(existsSync)
    .reduce((n, f) => n + statSync(f).size, 0);

  console.log(`${Object.keys(index).length}/${items.length} have audio (${rendered} rendered now, ${(bytes / 1048576).toFixed(1)} MB). Index: ${indexFile}`);
  return Object.keys(index).length === items.length;
}

let complete = true;

if (!faqOnly) {
  const stops = readTour();
  if (stops.length === 0) {
    console.error('Could not read any tour stops out of src/chatbot/tour.ts — has its shape changed?');
    process.exit(1);
  }
  complete =
    (await renderSet({
      label: 'Tour',
      items: stops.map((stop, i) => ({ key: stop.path, name: `stop-${String(i + 1).padStart(2, '0')}`, line: stop.line })),
      dir: 'tour',
      indexFile: 'src/chatbot/tourAudio.json',
      publicPrefix: '/media/tour',
    })) && complete;
}

if (!tourOnly) {
  const answers = readAnswers();
  complete =
    (await renderSet({
      label: 'Prepared answers',
      items: answers.map((a) => ({ key: `${a.id}:${a.language}`, name: `${a.id}-${a.language}`, line: a.line })),
      dir: 'faq',
      indexFile: 'src/chatbot/faqAudio.json',
      publicPrefix: '/media/faq',
    })) && complete;
}

if (!complete) console.log('\nLines without audio are spoken live, as before.');
console.log('Run `npm run offline:manifest` so the clips are cached for offline use.');
