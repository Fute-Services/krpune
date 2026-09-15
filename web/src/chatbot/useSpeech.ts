/**
 * Voice for the guide.
 *
 * Speaking  → ElevenLabs. Falls back to the browser's own speechSynthesis if
 *             the request fails or no ElevenLabs key is configured, so a billing
 *             problem makes the guide sound worse rather than go mute.
 * Listening → the microphone is recorded with MediaRecorder and transcribed by
 *             Groq's Whisper. Deliberately NOT the Web Speech API: that is
 *             Chrome-only and prefixed, so on the iPads this app is built for it
 *             does not exist at all. MediaRecorder plus a transcription endpoint
 *             works in every browser that can ask for a microphone.
 *
 * Both paths need the network. That is fine — the guide itself does too.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createBargeInDetector } from './bargeIn';

const TTS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
const STT_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_TTS_ENDPOINT = 'https://api.groq.com/openai/v1/audio/speech';

/**
 * How fast the guide talks, applied at playback so ElevenLabs, Groq and the
 * pre-rendered tour clips all slow down together without re-rendering any of
 * them. The browser keeps the pitch, so it sounds calmer rather than deeper.
 * 1.0 was too quick for a visitor listening while looking at a screen.
 */
const SPEECH_RATE = 0.9;

/**
 * The second natural voice, on the Groq key the guide already uses.
 *
 * It exists because the first one ran out: ElevenLabs' free tier is 10,000
 * characters a month and one run of the guided tour speaks about 6,000 of them,
 * so the kiosk went robotic after a day and a half. This is billed per
 * character (about a rupee a tour) rather than by plan.
 *
 * Two constraints come with it, both handled below: 200 characters per request,
 * so anything longer is spoken in pieces; and the model is English-only, so a
 * reply in Devanagari is left to the browser rather than being read by a voice
 * that cannot pronounce it.
 */
const GROQ_TTS_MODEL = 'canopylabs/orpheus-v1-english';
const GROQ_TTS_CHARS = 200;

/** Orpheus women: Autumn, Diana, Hannah. Overridable per deployment. */
const GROQ_DEFAULT_VOICE = 'Autumn';

/** Lowest-latency multilingual voice model — it handles Hindi and Hinglish. */
const TTS_MODEL = 'eleven_flash_v2_5';

/** "Sarah — mature, reassuring, confident". Override per deployment if wanted. */
const DEFAULT_VOICE = 'EXAVITQu4vr4xnSDxMaL';

/** Whisper large v3 turbo: fastest of the two Groq serves, and multilingual. */
const STT_MODEL = 'whisper-large-v3-turbo';

/**
 * A hint about the subject, deliberately phrased as one ordinary sentence.
 *
 * It used to be a list of project terms — "Terms: Commerzone, Baner, Raheja,
 * podium, terrace, amenities..." — and that list was the reason the guide kept
 * answering questions nobody asked. Whisper treats the prompt as text preceding
 * the audio, so when the audio carries no clear speech it simply continues the
 * prompt: a visitor got back "Terms & Cormac, Raheja, podium, terrace, and the"
 * as their own question.
 *
 * Measured against silence and against a real question:
 *   term-list prompt  silence -> "Terms in the background."  (logprob -1.34)
 *   one sentence      silence -> nothing                     (logprob -0.58)
 *   no prompt         silence -> nothing                     (logprob -0.38)
 * and on real speech the term list scored slightly *worse* than no prompt at
 * all, so it was never buying the accuracy it was added for. A sentence keeps
 * the names in context without being a list that can be recited back.
 */
const STT_PROMPT = 'This is a question about Commerzone Baner, the K Raheja Corp project in Pune.';

/**
 * Below this the transcript is noise Whisper guessed at rather than words
 * someone said. Garbage from silence scored -1.34; real questions scored -0.09
 * to -0.13. -0.9 sits well clear of honest speech in a noisy room.
 */
const MIN_CONFIDENCE = -0.9;

/**
 * What Whisper emits when handed audio with nothing in it. These are not things
 * a visitor at a kiosk says, and treating one as a question means the guide
 * answers thin air.
 */
const HALLUCINATIONS = new Set([
  '',
  '.',
  'you',
  'thank you',
  'thanks for watching',
  'thank you for watching',
  'um',
  'uh',
]);

function isNoise(text: string): boolean {
  const bare = text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-—’]/g, '')
    .trim();
  if (HALLUCINATIONS.has(bare)) return true;
  // A "question" of one or two characters is a cough, not speech.
  return bare.replace(/\s/g, '').length < 3;
}

/* ── When to stop recording ────────────────────────────────────────────────
   The visitor should be able to say their piece and get an answer without
   reaching for the screen again, so the recorder listens for them to stop
   rather than waiting to be told. */

/**
 * The quietest thing still treated as speech.
 *
 * This number has been wrong in both directions. It started at 0.015, taken
 * from a clip recorded straight into a microphone, and the guide could not hear
 * anyone standing normally at the screen. It was then raised to 0.05 to stop it
 * picking up the room — measured, again, by attenuating that same studio clip
 * rather than by listening to the actual kiosk microphone, and it went deaf
 * again.
 *
 * So it is now deliberately low, and the room's own noise floor does the
 * discriminating: the recorder only refuses audio that never rose meaningfully
 * above the room it was recorded in. Everything else goes to Whisper, which is
 * a far better judge of whether words were said than a loudness number is, and
 * whose confidence score is already checked. The cost of guessing wrong here is
 * asymmetric — a stray transcript is filtered downstream, while a visitor who
 * is not heard simply gives up.
 */
const SPEECH_LEVEL = 0.012;
/** Quiet for this long after speech has started → they are done. */
const SILENCE_MS = 1400;
/** Nothing said at all within this → they tapped it by accident. */
const NO_SPEECH_MS = 7000;
/** Hard ceiling, so a noisy room cannot hold the microphone open forever. */
const MAX_RECORDING_MS = 30000;
/** Opening moments spent measuring the room rather than judging it. */
const CALIBRATION_MS = 350;

/**
 * iOS and iPadOS switch the whole audio session into voice-chat mode while a
 * microphone is open, which reroutes and quietens everything the page plays.
 * Listening for an interruption there would make every answer quieter, so on
 * those devices the guide is interrupted by tapping the mic instead.
 */
const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const MIC_CONSTRAINTS: MediaStreamConstraints = {
  // An experience centre is a hard room: other visitors, the app's own videos
  // playing through the speakers, air conditioning. Letting the browser cancel
  // the echo and lift the voice out of it is worth more than anything that can
  // be done to the audio afterwards — without echo cancellation the guide
  // transcribes its own answer.
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

function elevenKey(): string | undefined {
  return import.meta.env.VITE_ELEVENLABS_API_KEY;
}

/**
 * A provider that has already refused is not asked again this session.
 *
 * An exhausted quota or unaccepted model terms will not fix themselves before
 * the page reloads, and retrying costs every single line a failed round trip
 * before it is spoken — which the visitor hears as the guide hesitating.
 */
const disabled = { eleven: false, groq: false };

/** Split for Orpheus's 200-character limit, on sentence ends where possible. */
export function splitForSpeech(text: string, limit = GROQ_TTS_CHARS): string[] {
  const pieces: string[] = [];
  // Sentence boundaries first: a break mid-clause is audible, a break between
  // sentences is just a pause.
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];

  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length <= limit) {
      current += sentence;
      continue;
    }
    if (current) pieces.push(current.trim());
    current = '';

    if (sentence.length <= limit) {
      current = sentence;
      continue;
    }
    // One sentence longer than the limit — fall back to word boundaries.
    let line = '';
    for (const word of sentence.split(/\s+/)) {
      if ((line + ' ' + word).trim().length > limit) {
        if (line) pieces.push(line.trim());
        line = word;
      } else {
        line = (line + ' ' + word).trim();
      }
    }
    current = line;
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces.filter(Boolean);
}

function voiceId(): string {
  return import.meta.env.VITE_ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
}

/**
 * Renders one line with the best voice that will take it: ElevenLabs, then
 * Groq's Orpheus. Resolves to the audio, or to null when neither can — the
 * caller then reads the line with the browser's own voice.
 */
async function fetchVoice(line: string, signal: AbortSignal, live: () => boolean): Promise<Blob[] | null> {
  const eleven = elevenKey();
  const groq = import.meta.env.VITE_GROQ_API_KEY;

  /** ElevenLabs. Best voice, and the only one that reads Devanagari. */
  if (eleven && !disabled.eleven) {
    try {
      const response = await fetch(`${TTS_ENDPOINT}/${voiceId()}`, {
        method: 'POST',
        signal,
        headers: { 'xi-api-key': eleven, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: line, model_id: TTS_MODEL }),
      });
      if (!response.ok) {
        // 401 here is an exhausted quota as often as a bad key, and neither
        // recovers before a reload.
        if (response.status === 401 || response.status === 429) disabled.eleven = true;
        throw new Error(`ElevenLabs ${response.status}`);
      }
      return [await response.blob()];
    } catch (error) {
      if (signal.aborted || !live()) return null;
      console.warn('[guide] ElevenLabs unavailable', error);
    }
  }

  /**
   * Groq's Orpheus. English only, 200 characters a request — so Devanagari is
   * left alone and longer lines are spoken in pieces.
   */
  if (groq && !disabled.groq && !/[ऀ-ॿ]/.test(line)) {
    try {
      const clips: Blob[] = [];
      for (const piece of splitForSpeech(line)) {
        const response = await fetch(GROQ_TTS_ENDPOINT, {
          method: 'POST',
          signal,
          headers: { Authorization: `Bearer ${groq}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: GROQ_TTS_MODEL,
            input: piece,
            voice: import.meta.env.VITE_GROQ_TTS_VOICE || GROQ_DEFAULT_VOICE,
            response_format: 'wav',
          }),
        });
        if (!response.ok) {
          // The model needs its terms accepted once, by the account owner, in
          // the Groq console. Until then this is a permanent 400 and there is
          // no point asking again this session.
          if (response.status === 400 || response.status === 401) disabled.groq = true;
          throw new Error(`Groq TTS ${response.status}`);
        }
        clips.push(await response.blob());
        if (!live()) return null;
      }
      return clips;
    } catch (error) {
      if (signal.aborted || !live()) return null;
      console.warn('[guide] Groq voice unavailable', error);
    }
  }

  if (!signal.aborted && live()) console.warn('[guide] no natural voice available — using the browser voice');
  return null;
}

/* ── Choosing the fallback voice ───────────────────────────────────────────
   The Web Speech API exposes no gender and no quality ranking, only a name and
   a BCP-47 tag, so the choice has to be made by name. These are the women's
   voices that actually ship on the platforms this kiosk runs on. */
const FEMALE_VOICES =
  /neerja|kalpana|swara|aditi|raveena|zira|samantha|karen|moira|tessa|veena|lekha|heera|female|woman/i;

/**
 * Old voices that are especially flat, listed so they lose to any other woman
 * on the device. Heera is the only Indian English woman Windows ships by
 * default and she reads like a station announcement; Zira is the same vintage
 * but markedly less lifeless, at the cost of an American accent. Neither is
 * good — the answer is a natural voice, and this only decides which robot
 * speaks until there is one.
 */
const LAST_RESORT_VOICES = /heera|ravi/i;

/** Named explicitly so a name that happens to contain one never slips through. */
const MALE_VOICES = /david|mark|ravi|hemant|madhur|prabhat|daniel|alex|fred|george|male\b/i;

/**
 * The engines that do not sound like a speak-and-spell.
 *
 * Windows ships two generations of voice under the same API: the old SAPI ones
 * (Heera, Zira, David) which are flat and robotic, and the newer neural ones
 * ("Microsoft Neerja (Natural)", "Microsoft Aria Online (Natural)") which are
 * close to a recording. Chrome exposes Google's network voices the same way.
 * Nothing in the API says which is which except the name, so the name is what
 * gets matched — and quality is weighed before accent, because a natural
 * American voice is easier to listen to than a robotic Indian one.
 */
const NATURAL_VOICES = /natural|neural|online|google|premium|enhanced|siri/i;

/**
 * Picks the best available voice, best meaning: an Indian accent, and a woman.
 *
 * Both were being got wrong. The code asked for `en-IN` and then matched on the
 * language *prefix*, so on a Windows machine it settled on "Microsoft David —
 * English (United States)": a male American voice reading Hinglish, which is
 * why the Hindi came out mispronounced. An exact region match has to come
 * first, and only then the fallbacks.
 *
 * Nothing here is guaranteed to exist. A device with no Indian voice installed
 * gets the best English woman it has; a device with nothing at all gets the
 * default, which still speaks.
 */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;

  const normalised = voices.map((v) => ({ voice: v, lang: v.lang.replace('_', '-').toLowerCase() }));
  const wanted = lang.toLowerCase();

  // Language before region. An English voice with an American accent still
  // reads English correctly; a Hindi voice reading English does not. iPads make
  // this real — iOS ships Rishi (Indian English, male) and Lekha (Hindi,
  // female), so "any Indian woman" would put a Hindi voice on English text.
  const sameLanguage = normalised.filter((v) => v.lang.startsWith(wanted.split('-')[0]));
  const sameLanguageIndian = sameLanguage.filter((v) => v.lang.endsWith('-in'));
  const anyIndian = normalised.filter((v) => v.lang.endsWith('-in'));

  const natural = (list: typeof normalised) => list.filter((v) => NATURAL_VOICES.test(v.voice.name));
  const female = (list: typeof normalised) =>
    list.find((v) => FEMALE_VOICES.test(v.voice.name) && !LAST_RESORT_VOICES.test(v.voice.name))
      ?.voice ?? list.find((v) => FEMALE_VOICES.test(v.voice.name))?.voice;
  const notMale = (list: typeof normalised) =>
    list.find((v) => !MALE_VOICES.test(v.voice.name))?.voice;

  return (
    // Everything we want: a natural engine, an Indian accent, a woman.
    female(natural(sameLanguageIndian)) ??
    female(natural(sameLanguage)) ??
    notMale(natural(sameLanguageIndian)) ??
    notMale(natural(sameLanguage)) ??
    // Any natural voice beats any robotic one — that gap is wider than accent.
    natural(sameLanguage)[0]?.voice ??
    // Nothing natural installed. Back to the old rules: accent, then gender.
    female(sameLanguageIndian) ??
    female(sameLanguage) ??
    female(anyIndian) ??
    notMale(sameLanguageIndian) ??
    notMale(sameLanguage) ??
    // Whatever there is. It still speaks, which beats silence.
    sameLanguageIndian[0]?.voice ??
    sameLanguage[0]?.voice
  );
}

/**
 * The fallback voice, used when ElevenLabs is unavailable — no key, a failed
 * request, or an exhausted quota.
 *
 * getVoices() is empty on Chrome's first call because the list arrives
 * asynchronously, so it is read at speak time rather than cached at load.
 */
function browserSpeak(text: string, onEnd: () => void): void {
  if (!('speechSynthesis' in window)) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = /[ऀ-ॿ]/.test(text) ? 'hi-IN' : 'en-IN';
  const voice = pickVoice(utterance.lang);
  if (voice) utterance.voice = voice;
  // The old SAPI voices are slow and flat at their default rate — they read as
  // lifeless rather than calm. A little faster with the pitch nudged up is as
  // close to lively as they get. 1.25 overshot, 1.12 was still quick, and 1.02
  // was still a touch fast to follow while looking at a screen.
  utterance.rate = 0.92;
  utterance.pitch = 1.15;

  // speechSynthesis does not always report that it has finished — with no
  // usable voice installed, or when the engine is wedged, `end` simply never
  // comes. Waiting on it forever left the guide "Speaking…" for good: the tour
  // stuck on one screen, hands-free never reopening the mic, and the
  // conversation never cleared for the next visitor. So the line is also given
  // a generous deadline, from how long it should take to say.
  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    window.clearTimeout(deadline);
    onEnd();
  };
  const expectedMs = (text.length / 12) * 1000; // ~12 characters a second at this rate
  const deadline = window.setTimeout(() => {
    console.warn('[guide] the browser voice never said it had finished — moving on');
    finish();
  }, expectedMs * 2 + 4000);

  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
}

export interface SpeechOptions {
  /**
   * Stop and listen if the visitor starts talking over this line. Only honoured
   * where `canBargeIn` is true.
   */
  bargeIn?: boolean;
}

/** A reply that is spoken while it is still being written. */
export interface SpeechStream {
  /** Queue the next piece. It starts rendering now and plays after the last. */
  push: (text: string) => void;
  /** Nothing more is coming; `onEnd` fires once what is queued has been said. */
  end: () => void;
}

export interface Speech {
  /**
   * Live loudness, 0-1, of whichever side is making noise — the visitor while
   * the mic is open, the guide while it is speaking.
   *
   * A ref rather than state on purpose: this changes every animation frame, and
   * putting it through React would re-render the whole panel sixty times a
   * second to move one circle. The orb reads it in its own rAF loop and writes
   * to the DOM directly.
   */
  levelRef: React.RefObject<number>;
  /**
   * Play a pre-rendered clip instead of paying to synthesise the line again,
   * falling back to speak() if the file is missing. See scripts/generate-tour-audio.mjs.
   */
  speakClip: (url: string, fallbackText: string, onEnd?: () => void) => void;
  /** Speak a line. Cancels whatever is currently being said. `onEnd` fires when
   *  the line has finished, or immediately if it could not be spoken at all —
   *  the tour steps on it, so it must never simply not arrive. */
  speak: (text: string, onEnd?: () => void, options?: SpeechOptions) => void;
  /** Start a reply that arrives in pieces. Same contract as speak() for `onEnd`. */
  beginSpeech: (onEnd?: () => void, options?: SpeechOptions) => SpeechStream;
  stopSpeaking: () => void;
  speaking: boolean;
  /** False only where the browser cannot record at all. */
  canListen: boolean;
  /** Whether talking over the guide can interrupt it on this device. */
  canBargeIn: boolean;
  listening: boolean;
  /** True while the recording is being transcribed. */
  transcribing: boolean;
  startListening: () => void;
  /** Stops the recording and sends it for transcription. */
  stopListening: () => void;
}

export function useSpeech(
  onTranscript: (text: string) => void,
  /** Nothing was said, or what came back could not be trusted. Told to the
   *  visitor, because silently doing nothing reads as a broken microphone. */
  onNothingHeard?: () => void,
): Speech {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const levelRef = useRef(0);
  /** Raw playback loudness, for telling the guide's echo from the visitor. */
  const playbackLevel = useRef(0);
  const levelFrame = useRef(0);
  /** Settles the line currently being spoken; see beginSpeech(). */
  const finishSpeaking = useRef<(() => void) | null>(null);
  /**
   * Bumped on every new line. Everything asynchronous inside one checks it
   * before making a sound, so a slow ElevenLabs response cannot start playing
   * over a line that replaced it — two voices at once is the one failure the
   * visitor cannot ignore.
   */
  const generation = useRef(0);

  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  /**
   * True from the moment a recording is asked for until it is running.
   * getUserMedia is asynchronous, and without this a second call in that gap —
   * a tap on the mic whose stopSpeaking() fires the reply's "reopen the mic"
   * callback — opened two recorders and sent the same question twice.
   */
  const opening = useRef(false);
  const chunks = useRef<Blob[]>([]);
  const ttsRequest = useRef<AbortController | null>(null);

  const canListen = useRef(
    typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
  ).current;
  const canBargeIn = canListen && !IS_IOS && typeof AudioContext !== 'undefined';

  // Held in a ref so the recorder callbacks, wired up once per recording, always
  // reach the current handler rather than the one from an older render.
  const handler = useRef(onTranscript);
  handler.current = onTranscript;
  const noSpeech = useRef(onNothingHeard);
  noSpeech.current = onNothingHeard;
  /** startListening, reachable from beginSpeech which is defined before it. */
  const listenRef = useRef<() => void>(() => {});

  /**
   * Feeds levelRef from whatever is currently making sound.
   *
   * Two callers: the microphone stream while the visitor talks, and the TTS
   * <audio> element while the guide answers — so the orb in the panel is driven
   * by the actual waveform in both directions rather than a canned animation.
   */
  const runMeter = useCallback(
    (analyser: AnalyserNode, stillRunning: () => boolean, raw?: React.MutableRefObject<number>) => {
      const samples = new Float32Array(analyser.fftSize);
      cancelAnimationFrame(levelFrame.current);

      const tick = (): void => {
        if (!stillRunning()) {
          levelRef.current = 0;
          if (raw) raw.current = 0;
          return;
        }
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const rms = Math.sqrt(sum / samples.length);
        if (raw) raw.current = rms;
        // Normalised against a level a person actually speaks at, then eased —
        // raw RMS makes the orb twitch rather than breathe.
        const target = Math.min(1, rms / 0.12);
        levelRef.current += (target - levelRef.current) * 0.35;
        levelFrame.current = requestAnimationFrame(tick);
      };
      levelFrame.current = requestAnimationFrame(tick);
    },
    [],
  );

  /** Routes the spoken reply through an analyser on its way to the speakers. */
  const meterPlayback = useCallback(
    (element: HTMLAudioElement) => {
      try {
        const context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        const source = context.createMediaElementSource(element);
        // Must still reach the output — an analyser alone is a dead end and the
        // reply would play silently.
        source.connect(analyser);
        analyser.connect(context.destination);
        runMeter(analyser, () => !element.paused && !element.ended, playbackLevel);
        // On pause as well as on end: a line cut off mid-clip never fires
        // `ended`, and each one used to leave an AudioContext open behind it.
        // Replies are now several clips each, and browsers cap open contexts.
        const close = () => void context.close().catch(() => {});
        element.addEventListener('pause', close, { once: true });
        element.addEventListener('ended', close, { once: true });
      } catch {
        // No Web Audio, or the element is already wired to a context. The voice
        // still plays; only the visualisation is lost.
      }
    },
    [runMeter],
  );

  const releaseAudio = useCallback(() => {
    if (audio.current) {
      audio.current.pause();
      audio.current.src = '';
      audio.current = null;
    }
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    ttsRequest.current?.abort();
    ttsRequest.current = null;
    releaseAudio();
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    // Settle whatever was in flight. Without this a stop mid-line leaves the
    // tour waiting on a callback that can never arrive.
    const pending = finishSpeaking.current;
    finishSpeaking.current = null;
    pending?.();
  }, [releaseAudio]);

  /**
   * Plays a sequence of audio blobs back to back through one element, so a
   * reply split for Orpheus's 200-character limit is heard as one sentence
   * rather than as several clips.
   */
  const playClips = useCallback(
    (
      clips: Blob[],
      alive: () => boolean,
      onDone: () => void,
      onFail: () => void,
      onPlaying?: () => void,
    ) => {
      let index = 0;

      const next = (): void => {
        if (!alive()) return;
        if (index >= clips.length) {
          onDone();
          return;
        }
        const url = URL.createObjectURL(clips[index]);
        index += 1;
        objectUrl.current = url;
        const element = new Audio(url);
        element.playbackRate = SPEECH_RATE;
        meterPlayback(element);
        audio.current = element;
        element.onended = () => {
          releaseAudio();
          next();
        };
        element.onerror = () => {
          releaseAudio();
          onFail();
        };
        void element
          .play()
          .then(() => onPlaying?.())
          .catch(() => {
            releaseAudio();
            onFail();
          });
      };

      next();
    },
    [meterPlayback, releaseAudio],
  );

  /**
   * One spoken turn, fed in pieces.
   *
   * Each piece starts rendering the moment it is pushed and plays as soon as
   * the one before it has finished, so the first sentence of a reply is heard
   * while the model is still writing the last. Renders run one after another
   * rather than all at once: ElevenLabs answers a burst of parallel requests
   * with 429, and a 429 switches it off for the rest of the session.
   */
  const beginSpeech = useCallback(
    (onEnd?: () => void, options: SpeechOptions = {}): SpeechStream => {
      stopSpeaking();

      generation.current += 1;
      const mine = generation.current;
      const controller = new AbortController();
      ttsRequest.current = controller;
      const live = (): boolean => generation.current === mine && !controller.signal.aborted;

      const monitor = { stop: () => {}, meterable: false, started: false };

      // Fires exactly once however this turn ends — played out, failed, or
      // cancelled. The tour advances on it, so a path that forgets to call it
      // would strand the tour on one screen forever.
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        monitor.stop();
        if (ttsRequest.current === controller) ttsRequest.current = null;
        setSpeaking(false);
        onEnd?.();
      };
      finishSpeaking.current = finish;

      /**
       * Listens for the visitor talking over the guide. Opened on the first clip
       * that actually plays — there is no echo to measure before that — and only
       * judged while a metered clip is playing: the browser's own voice cannot
       * be measured, and judging it blind would stop the guide on its own echo.
       */
      const startMonitor = (): void => {
        if (monitor.started || !options.bargeIn || !canBargeIn || !live()) return;
        monitor.started = true;

        void (async () => {
          let stream: MediaStream;
          try {
            stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
          } catch {
            return; // No mic or no permission: tapping the mic still interrupts.
          }
          if (!live()) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          const context = new AudioContext();
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024;
          context.createMediaStreamSource(stream).connect(analyser);
          const samples = new Float32Array(analyser.fftSize);
          const detector = createBargeInDetector();
          let last = performance.now();

          const release = (): void => {
            window.clearInterval(timer);
            stream.getTracks().forEach((track) => track.stop());
            void context.close().catch(() => {});
          };

          const timer = window.setInterval(() => {
            if (!live()) {
              release();
              return;
            }
            const now = performance.now();
            const dt = now - last;
            last = now;
            if (!monitor.meterable) return;

            analyser.getFloatTimeDomainData(samples);
            let sum = 0;
            for (const sample of samples) sum += sample * sample;
            const mic = Math.sqrt(sum / samples.length);

            if (detector.push(mic, playbackLevel.current, dt)) {
              console.info(
                `[guide] barge-in: the visitor spoke over the guide (mic ${mic.toFixed(3)}, playback ${playbackLevel.current.toFixed(3)})`,
              );
              release();
              stopSpeaking();
              listenRef.current();
            }
          }, 60);

          monitor.stop = release;
        })();
      };

      const queue: { text: string; audio: Promise<Blob[] | null> }[] = [];
      let rendering: Promise<unknown> = Promise.resolve();
      let playing = false;
      let ended = false;

      const render = (line: string): Promise<Blob[] | null> => {
        const result = rendering.then(() => (live() ? fetchVoice(line, controller.signal, live) : null));
        rendering = result.catch(() => null);
        return result.catch(() => null);
      };

      const pump = (): void => {
        if (!live() || playing) return;
        const item = queue.shift();
        if (!item) {
          if (ended) finish();
          return;
        }
        playing = true;
        const done = (): void => {
          playing = false;
          pump();
        };

        void item.audio.then((clips) => {
          if (!live()) return;
          if (clips && clips.length > 0) {
            monitor.meterable = true;
            playClips(
              clips,
              live,
              done,
              () => {
                // releaseAudio() before handing the line to another engine,
                // every time: starting a second voice while the first element
                // is still going is how a visitor ends up being read to by two
                // people at once.
                releaseAudio();
                if (!live()) return;
                console.warn('[guide] audio would not play — using the browser voice');
                monitor.meterable = false;
                browserSpeak(item.text, () => live() && done());
              },
              startMonitor,
            );
          } else {
            monitor.meterable = false;
            browserSpeak(item.text, () => live() && done());
          }
        });
      };

      return {
        push: (text: string) => {
          const line = text.trim();
          if (!line || ended || !live()) return;
          setSpeaking(true);
          queue.push({ text: line, audio: render(line) });
          pump();
        },
        end: () => {
          if (ended || settled) return;
          ended = true;
          if (!playing && queue.length === 0) finish();
        },
      };
    },
    [canBargeIn, playClips, releaseAudio, stopSpeaking],
  );

  const speak = useCallback(
    (text: string, onEnd?: () => void, options?: SpeechOptions) => {
      const line = text.trim();
      if (!line) {
        onEnd?.();
        return;
      }
      const turn = beginSpeech(onEnd, options);
      turn.push(line);
      turn.end();
    },
    [beginSpeech],
  );

  /**
   * Plays narration that was rendered ahead of time.
   *
   * The tour's lines never change, so buying their audio again on every run was
   * simply money set on fire — about 6,000 characters a run, against a free
   * tier of 10,000. A rendered clip costs nothing, starts instantly instead of
   * after a round trip, and plays with the network off like everything else in
   * this app.
   *
   * Falls back to speaking the line if the file is not there, so a deployment
   * where the clips were never generated behaves exactly as before.
   */
  const speakClip = useCallback(
    (url: string, fallbackText: string, onEnd?: () => void) => {
      stopSpeaking();
      setSpeaking(true);

      generation.current += 1;
      const mine = generation.current;
      const alive = (): boolean => generation.current === mine;

      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        setSpeaking(false);
        onEnd?.();
      };
      finishSpeaking.current = finish;

      const element = new Audio(url);
      element.playbackRate = SPEECH_RATE;
      meterPlayback(element);
      audio.current = element;
      element.onended = () => {
        releaseAudio();
        finish();
      };
      element.onerror = () => {
        if (!alive()) return;
        releaseAudio();
        // Missing or unplayable clip: say it the expensive way rather than
        // leaving a silent screen in the middle of a tour.
        settled = true;
        speak(fallbackText, onEnd);
      };
      void element.play().catch(() => {
        if (!alive()) return;
        releaseAudio();
        settled = true;
        speak(fallbackText, onEnd);
      });
    },
    [meterPlayback, releaseAudio, speak, stopSpeaking],
  );

  const stopListening = useCallback(() => {
    // The transcription is kicked off by the recorder's onstop handler below.
    if (recorder.current?.state === 'recording') recorder.current.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!canListen) return;
    if (opening.current || recorder.current?.state === 'recording') return;
    opening.current = true;
    // Speaking and listening at once means the guide transcribes itself.
    stopSpeaking();

    void (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
      } catch {
        // Permission denied or no microphone. Typing still works.
        opening.current = false;
        setListening(false);
        return;
      }

      const rec = new MediaRecorder(stream);
      recorder.current = rec;
      chunks.current = [];

      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };

      // ── Stop on silence ──────────────────────────────────────────────────
      // Watching the live audio level rather than a fixed timer: a visitor who
      // finishes a short question gets an answer straight away, and one who
      // thinks mid-sentence is not cut off.
      const meter = new AudioContext();
      const analyser = meter.createAnalyser();
      analyser.fftSize = 1024;
      meter.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      // Same analyser drives the orb — the visitor sees their own voice.
      runMeter(analyser, () => rec.state === 'recording');

      const startedAt = Date.now();
      let heardSpeech = false;
      let quietSince = 0;

      // The first moments are measured rather than assumed, so the bar for
      // "someone is talking" sits above whatever this particular room sounds
      // like. A fixed threshold is either deaf in a quiet office or permanently
      // triggered by a busy sales floor.
      let noiseFloor = 0;
      let noiseSamples = 0;
      let peak = 0;

      const watchdog = window.setInterval(() => {
        if (rec.state !== 'recording') return;
        analyser.getFloatTimeDomainData(samples);

        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const level = Math.sqrt(sum / samples.length);

        const elapsed = Date.now() - startedAt;

        if (elapsed < CALIBRATION_MS) {
          noiseFloor += level;
          noiseSamples += 1;
          return;
        }

        const floor = noiseSamples > 0 ? noiseFloor / noiseSamples : 0;
        const threshold = Math.max(SPEECH_LEVEL, floor * 2.5);
        if (level > peak) peak = level;

        if (level > threshold) {
          heardSpeech = true;
          quietSince = 0;
        } else if (heardSpeech) {
          if (quietSince === 0) quietSince = Date.now();
          if (Date.now() - quietSince >= SILENCE_MS) stopForVad();
        } else if (elapsed >= NO_SPEECH_MS) {
          stopForVad();
        }

        if (elapsed >= MAX_RECORDING_MS) stopForVad();
      }, 120);

      function stopForVad(): void {
        window.clearInterval(watchdog);
        if (rec.state === 'recording') rec.stop();
        setListening(false);
      }

      rec.onstop = () => {
        window.clearInterval(watchdog);
        void meter.close().catch(() => {});
        // Release the mic immediately — otherwise the browser keeps showing a
        // recording indicator for the rest of the session.
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' });
        chunks.current = [];

        // Do not transcribe a room that never spoke — that is where the
        // invented questions came from. But "never spoke" has to mean silence,
        // not "quieter than expected": the first version of this check used only
        // the live threshold and threw away people who were simply standing back
        // from the screen. The loudest moment of the recording gets a second
        // say, measured against the room's own noise floor.
        const room = noiseSamples > 0 ? noiseFloor / noiseSamples : 0;
        // Deliberately looser than the live threshold: this only has to rule
        // out a recording of nothing at all.
        const loudEnough = peak > Math.max(0.006, room * 2);

        console.info(
          `[guide] mic: peak=${peak.toFixed(4)} room=${room.toFixed(4)} ` +
            `speech=${heardSpeech} loudEnough=${loudEnough} bytes=${blob.size}`,
        );

        if ((!heardSpeech && !loudEnough) || blob.size < 1200) {
          noSpeech.current?.();
          return;
        }

        setTranscribing(true);
        void (async () => {
          try {
            const form = new FormData();
            // The extension has to match the container or Whisper rejects it.
            const ext = (rec.mimeType || 'audio/webm').includes('mp4') ? 'mp4' : 'webm';
            form.append('file', new File([blob], `speech.${ext}`, { type: blob.type }));
            form.append('model', STT_MODEL);
            form.append('prompt', STT_PROMPT);
            // verbose_json carries per-segment avg_logprob, which is the only
            // way to tell a confident transcript from a guess.
            form.append('response_format', 'verbose_json');
            // Greedy decoding: this is a short question, not prose, and a
            // creative transcript is a wrong transcript.
            form.append('temperature', '0');
            // `language` is left unset on purpose: Whisper detects it itself,
            // and pinning it to English mangles the Hindi half of Hinglish.
            const response = await fetch(STT_ENDPOINT, {
              method: 'POST',
              headers: { Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
              body: form,
            });
            if (!response.ok) throw new Error(`Whisper ${response.status}`);
            const result = (await response.json()) as {
              text?: string;
              segments?: { avg_logprob?: number }[];
            };

            const text = (result.text ?? '').trim();
            const confidence = result.segments?.length
              ? Math.min(...result.segments.map((s) => s.avg_logprob ?? 0))
              : 0;

            console.info(`[guide] heard "${text}" (confidence ${confidence.toFixed(2)})`);

            if (!text || isNoise(text)) {
              noSpeech.current?.();
              return;
            }
            // Low confidence alone is not enough to throw a transcript away.
            // Whisper scores accented speech and a noisy room down, and a strict
            // cut-off silently refused real questions. What it cannot do is
            // produce a *long* sentence out of nothing, so a few words scored
            // badly is a guess worth dropping, while a proper sentence is not.
            if (confidence < MIN_CONFIDENCE && text.split(/\s+/).length <= 3) {
              console.warn(`[guide] dropped a short, low-confidence transcript: "${text}"`);
              noSpeech.current?.();
              return;
            }
            handler.current(text);
          } catch (error) {
            console.warn('[guide] transcription failed', error);
          } finally {
            setTranscribing(false);
          }
        })();
      };

      rec.start();
      opening.current = false;
      setListening(true);
    })();
  }, [canListen, runMeter, stopSpeaking]);
  listenRef.current = startListening;

  // A closed panel or a page change must not leave a voice talking to an empty
  // room, or the microphone light on.
  useEffect(
    () => () => {
      // Retires every line in flight, which also shuts any interruption monitor.
      generation.current += 1;
      cancelAnimationFrame(levelFrame.current);
      ttsRequest.current?.abort();
      window.speechSynthesis?.cancel();
      if (recorder.current?.state === 'recording') recorder.current.stop();
      if (audio.current) audio.current.pause();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  return {
    levelRef,
    speak,
    beginSpeech,
    speakClip,
    stopSpeaking,
    speaking,
    canListen,
    canBargeIn,
    listening,
    transcribing,
    startListening,
    stopListening,
  };
}
