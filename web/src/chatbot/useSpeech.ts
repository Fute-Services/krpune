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

const TTS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
const STT_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_TTS_ENDPOINT = 'https://api.groq.com/openai/v1/audio/speech';

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
  'bye',
  'thank you',
  'thanks',
  'thanks for watching',
  'thank you for watching',
  'okay',
  'ok',
  'the',
  'so',
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

/** Loudness (0-1 RMS) above which we consider someone to be talking. */
const SPEECH_LEVEL = 0.015;
/** Quiet for this long after speech has started → they are done. */
const SILENCE_MS = 1400;
/** Nothing said at all within this → they tapped it by accident. */
const NO_SPEECH_MS = 7000;
/** Hard ceiling, so a noisy room cannot hold the microphone open forever. */
const MAX_RECORDING_MS = 30000;
/** Opening moments spent measuring the room rather than judging it. */
const CALIBRATION_MS = 350;

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

/* ── Choosing the fallback voice ───────────────────────────────────────────
   The Web Speech API exposes no gender and no quality ranking, only a name and
   a BCP-47 tag, so the choice has to be made by name. These are the women's
   voices that actually ship on the platforms this kiosk runs on. */
const FEMALE_VOICES =
  /heera|kalpana|swara|aditi|neerja|raveena|zira|samantha|karen|moira|tessa|veena|lekha|female|woman/i;

/** Named explicitly so a name that happens to contain one never slips through. */
const MALE_VOICES = /david|mark|ravi|hemant|madhur|prabhat|daniel|alex|fred|george|male\b/i;

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

  const female = (list: typeof normalised) =>
    list.find((v) => FEMALE_VOICES.test(v.voice.name))?.voice;
  const notMale = (list: typeof normalised) =>
    list.find((v) => !MALE_VOICES.test(v.voice.name))?.voice;

  return (
    // What we are actually after: the right language, an Indian accent, a woman.
    female(sameLanguageIndian) ??
    // Right language, right voice, wrong accent.
    female(sameLanguage) ??
    // Right accent at least.
    female(anyIndian) ??
    // No woman available on this device: anything but a man.
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
  // A shade above default. At 1.0 the stock voices plod; much beyond this and
  // they are hard to follow in a room with other people in it.
  utterance.rate = 1.08;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
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
  speak: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  speaking: boolean;
  /** False only where the browser cannot record at all. */
  canListen: boolean;
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
  const levelFrame = useRef(0);
  /** Settles the line currently being spoken; see speak(). */
  const finishSpeaking = useRef<(() => void) | null>(null);
  /**
   * Bumped on every speak(). Everything asynchronous inside a speak() checks it
   * before making a sound, so a slow ElevenLabs response cannot start playing
   * over a line that replaced it — two voices at once is the one failure the
   * visitor cannot ignore.
   */
  const generation = useRef(0);

  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const ttsRequest = useRef<AbortController | null>(null);

  const canListen = useRef(
    typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
  ).current;

  // Held in a ref so the recorder callbacks, wired up once per recording, always
  // reach the current handler rather than the one from an older render.
  const handler = useRef(onTranscript);
  handler.current = onTranscript;
  const noSpeech = useRef(onNothingHeard);
  noSpeech.current = onNothingHeard;

  /**
   * Feeds levelRef from whatever is currently making sound.
   *
   * Two callers: the microphone stream while the visitor talks, and the TTS
   * <audio> element while the guide answers — so the orb in the panel is driven
   * by the actual waveform in both directions rather than a canned animation.
   */
  const runMeter = useCallback((analyser: AnalyserNode, stillRunning: () => boolean) => {
    const samples = new Float32Array(analyser.fftSize);
    cancelAnimationFrame(levelFrame.current);

    const tick = (): void => {
      if (!stillRunning()) {
        levelRef.current = 0;
        return;
      }
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      const rms = Math.sqrt(sum / samples.length);
      // Normalised against a level a person actually speaks at, then eased —
      // raw RMS makes the orb twitch rather than breathe.
      const target = Math.min(1, rms / 0.12);
      levelRef.current += (target - levelRef.current) * 0.35;
      levelFrame.current = requestAnimationFrame(tick);
    };
    levelFrame.current = requestAnimationFrame(tick);
  }, []);

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
        runMeter(analyser, () => !element.paused && !element.ended);
        element.addEventListener('ended', () => void context.close().catch(() => {}), { once: true });
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
    (clips: Blob[], alive: () => boolean, onDone: () => void, onFail: () => void) => {
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
        void element.play().catch(() => {
          releaseAudio();
          onFail();
        });
      };

      next();
    },
    [meterPlayback, releaseAudio],
  );

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      const line = text.trim();
      if (!line) {
        onEnd?.();
        return;
      }

      stopSpeaking();
      setSpeaking(true);

      generation.current += 1;
      const mine = generation.current;
      const alive = (): boolean => generation.current === mine;

      // Fires exactly once however this line ends — played out, failed, or
      // cancelled. The tour advances on it, so a path that forgets to call it
      // would strand the tour on one screen forever.
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        setSpeaking(false);
        onEnd?.();
      };
      finishSpeaking.current = finish;

      const controller = new AbortController();
      ttsRequest.current = controller;

      // releaseAudio() before handing the line to another engine, every time:
      // starting a second voice while the first element is still going is how a
      // visitor ends up being read to by two people at once.
      const fallToBrowser = (why: string, error?: unknown): void => {
        if (!alive()) return;
        releaseAudio();
        console.warn(`[guide] ${why} — using the browser voice`, error ?? '');
        browserSpeak(line, finish);
      };

      /** ElevenLabs. Best voice, and the only one that reads Devanagari. */
      const viaElevenLabs = async (key: string): Promise<boolean> => {
        const response = await fetch(`${TTS_ENDPOINT}/${voiceId()}`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: line, model_id: TTS_MODEL }),
        });
        if (!response.ok) {
          // 401 here is an exhausted quota as often as a bad key, and neither
          // recovers before a reload.
          if (response.status === 401 || response.status === 429) disabled.eleven = true;
          throw new Error(`ElevenLabs ${response.status}`);
        }
        const blob = await response.blob();
        if (!alive()) return true;
        playClips([blob], alive, finish, () => fallToBrowser('ElevenLabs audio would not play'));
        return true;
      };

      /**
       * Groq's Orpheus. English only, 200 characters a request — so Devanagari
       * is left alone and longer lines are spoken in pieces.
       */
      const viaGroq = async (key: string): Promise<boolean> => {
        if (/[\u0900-\u097F]/.test(line)) return false;

        const pieces = splitForSpeech(line);
        const clips: Blob[] = [];
        for (const piece of pieces) {
          const response = await fetch(GROQ_TTS_ENDPOINT, {
            method: 'POST',
            signal: controller.signal,
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
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
          if (!alive()) return true;
        }
        playClips(clips, alive, finish, () => fallToBrowser('Groq audio would not play'));
        return true;
      };

      void (async () => {
        const eleven = elevenKey();
        const groq = import.meta.env.VITE_GROQ_API_KEY;

        try {
          if (eleven && !disabled.eleven && (await viaElevenLabs(eleven))) return;
        } catch (error) {
          if (controller.signal.aborted || !alive()) return;
          console.warn('[guide] ElevenLabs unavailable', error);
        }

        try {
          if (groq && !disabled.groq && (await viaGroq(groq))) return;
        } catch (error) {
          if (controller.signal.aborted || !alive()) return;
          console.warn('[guide] Groq voice unavailable', error);
        }

        if (controller.signal.aborted || !alive()) return;
        fallToBrowser('no natural voice available');
      })().finally(() => {
        if (ttsRequest.current === controller) ttsRequest.current = null;
      });
    },
    [playClips, releaseAudio, stopSpeaking],
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
    // Speaking and listening at once means the guide transcribes itself.
    stopSpeaking();

    void (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // An experience centre is a hard room: other visitors, the app's own
          // videos playing through the speakers, air conditioning. Letting the
          // browser cancel the echo and lift the voice out of it is worth more
          // than anything that can be done to the audio afterwards — without
          // echo cancellation the guide transcribes its own answer.
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        // Permission denied or no microphone. Typing still works.
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

        // Do not transcribe a room that never spoke. This is where the wrong
        // questions were coming from: the recorder stopped after seven seconds
        // of nothing and sent those seven seconds to Whisper anyway, which
        // dutifully invented a sentence out of the room tone. A mis-tap is now
        // a mis-tap, not a question the visitor never asked.
        if (!heardSpeech || blob.size < 2000) {
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

            if (!text || isNoise(text)) {
              noSpeech.current?.();
              return;
            }
            if (confidence < MIN_CONFIDENCE) {
              // Words came back, but Whisper was guessing. Better to ask the
              // visitor to repeat themselves than to answer a question they
              // did not ask.
              console.warn(`[guide] discarded a low-confidence transcript (${confidence.toFixed(2)}): ${text}`);
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
      setListening(true);
    })();
  }, [canListen, runMeter, stopSpeaking]);

  // A closed panel or a page change must not leave a voice talking to an empty
  // room, or the microphone light on.
  useEffect(
    () => () => {
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
    speakClip,
    stopSpeaking,
    speaking,
    canListen,
    listening,
    transcribing,
    startListening,
    stopListening,
  };
}
