/**
 * The guide's connection to Groq (OpenAI-compatible chat completions).
 *
 * Written against plain `fetch` rather than a vendor SDK on purpose: the only
 * pieces used here are one POST, an SSE stream, and a tool-call loop, and a
 * ~200 kB client for that on a kiosk bundle is not worth it.
 *
 * ── About the API key ────────────────────────────────────────────────────────
 * The key ships in the bundle. That was a deliberate call — this app has no
 * backend of any kind (see lib/auth.ts) — but it means anyone who opens devtools
 * on the deployed site can read VITE_GROQ_API_KEY and spend against it. So:
 * use a key created for this kiosk alone, keep a spend limit on it in the Groq
 * console, and treat rotating it as a redeploy.
 */
import { knowledgeBase, PROJECT_NAME, pageFor } from './knowledge';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/** The strongest general chat model Groq serves on this account. */
const MODEL = 'openai/gpt-oss-120b';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Wire shape — assistant turns can carry tool calls and no text. */
interface WireMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export function hasApiKey(): boolean {
  return Boolean(import.meta.env.VITE_GROQ_API_KEY);
}

const HOUSE_RULES = `You are the host of the K Raheja Corp experience centre for ${PROJECT_NAME}, a commercial development in Baner, Pune. Visitors talk to you on a touchscreen in the centre while they look at the screens of this app.

Your job is to explain what is on screen and answer questions about the project, the way a good sales host would: warm, brief, and never pushy.

How to speak:
- Your replies are read aloud, so write for the ear. Two or three short sentences is the right length. No bullet points, no markdown, no emoji, no headings, no stage directions.
- Match the visitor's language AND their script. If they write in Hinglish using English letters, reply in Hinglish using English letters — do not switch to Devanagari. If they write in Devanagari, reply in Devanagari. If they write in English, reply in English.
- Numbers are the point of a sales conversation: quote them exactly as the brief gives them. Never round, never embellish.

What you know:
- Everything below, and nothing else. If you are asked something the brief does not cover — pricing, rent, availability, possession dates, who the tenants are, anything about other projects — say plainly that you do not have that and that the sales team can answer it. Never guess, and never fill a gap with something that sounds plausible.
- You can take the visitor to any screen in the app with the show_page tool. Use it whenever the answer lives on another screen, or the moment they ask to see something. Say one short line about where you are taking them; the tool does the navigating.
- If they want to be shown around rather than shown one thing — a tour, a walkthrough, "sab dikhao", "take me through the project" — call start_tour instead, and say nothing. The tour narrates itself.

Answer the visitor directly. Never write down your own thinking, never explain what you are about to do or why, never write notes to yourself, and never refer to the visitor in the third person. The visitor reads every word you produce.`;

/** Rules first, then only the part of the brief this screen needs. */
function systemPrompt(pathname: string): string {
  return `${HOUSE_RULES}\n\n${knowledgeBase(pathname)}`;
}

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'start_tour',
      description:
        'Begin the guided tour: the app walks the visitor through every part of the project, screen by screen, narrating each one. Call this whenever they ask to be shown around, for a tour, a walkthrough, "sab dikhao", "take me through it", or anything that means the same. Say nothing else when you call it — the tour speaks for itself.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'show_page',
      description:
        'Navigate the app to one of its screens, so the visitor sees what you are describing. Use the exact route path from the brief.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The route to open, e.g. "/amenities" or "/project_details".',
          },
        },
        required: ['path'],
        additionalProperties: false,
      },
    },
  },
];

export class ChatError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

/**
 * Last line of defence against the model talking to itself in public.
 *
 * `reasoning_format: 'hidden'` is the actual fix; this catches the case where a
 * stray note still lands in the reply, because a visitor reading "We need to
 * respond properly, but user just asked to go to Gallery page" is the single
 * worst thing this feature can do on a sales floor.
 *
 * When a marker is found the usable answer is almost always what comes *after*
 * the aside — the model catches itself and then writes the real reply — so that
 * is what is kept, falling back to the text before it when there is nothing
 * after.
 */
const META = /\(\s*Note[\s\S]{0,200}?\)|\bwe need to respond\b|\bnow respond politely\b|\buser (?:just )?asked\b|\bwe should respond\b|\blet'?s respond\b|\bas an ai\b/gi;

export function scrubMeta(text: string): string {
  META.lastIndex = 0;
  if (!META.test(text)) return text;

  META.lastIndex = 0;
  let lastEnd = 0;
  let firstStart = text.length;
  for (let m = META.exec(text); m; m = META.exec(text)) {
    if (m.index < firstStart) firstStart = m.index;
    lastEnd = m.index + m[0].length;
  }

  // Step past the punctuation that ended the aside.
  const after = text.slice(lastEnd).replace(/^[\s.,;:!?—-]+/, '');
  if (after.length > 20) return after;

  return text.slice(0, firstStart).trim();
}

export interface AskOptions {
  history: ChatMessage[];
  question: string;
  /** Where the visitor is right now — so "what am I looking at" has an answer. */
  pathname: string;
  /** Receives the whole reply so far, already scrubbed — not a raw delta. */
  onText: (replySoFar: string) => void;
  /** Called when the model decides to move the app. */
  onNavigate: (path: string) => void;
  /** Called when the visitor asked to be shown around. */
  onStartTour: () => void;
  signal?: AbortSignal;
}

/**
 * Streams one assistant turn.
 *
 * The loop exists because navigation is a tool call: the model asks for a
 * screen, we move the app, and it then says its line about what the visitor is
 * now looking at. Two rounds is enough for that and puts a hard stop on a model
 * that decides to tour the whole app unprompted.
 */
export async function ask(options: AskOptions): Promise<string> {
  const { history, question, pathname, onText, onNavigate, onStartTour, signal } = options;

  const here = pageFor(pathname);
  // Where they are goes in the system prompt, not in a second system message
  // part-way down the list. gpt-oss renders the conversation into a channel
  // format and an extra system turn mid-list is not something it is trained on.
  const messages: WireMessage[] = [
    {
      role: 'system',
      content: `${systemPrompt(pathname)}\n\nThe visitor is looking at the ${
        here?.title ?? pathname
      } screen right now.`,
    },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  // Raw across both rounds; what reaches the screen is always scrubbed.
  let reply = '';

  for (let round = 0; round < 2; round += 1) {
    const done = reply;
    const { text, toolCalls } = await streamOnce(
      messages,
      (soFar) => onText(scrubMeta(done + soFar).trim()),
      signal,
    );
    reply += text;

    if (toolCalls.length === 0) return scrubMeta(reply).trim();

    // The tour takes over the panel entirely — it narrates every stop itself —
    // so this turn ends here rather than going round again for a line the tour
    // is about to speak over.
    if (toolCalls.some((call) => call.function.name === 'start_tour')) {
      onStartTour();
      return scrubMeta(reply).trim();
    }

    messages.push({ role: 'assistant', content: text || null, tool_calls: toolCalls });
    for (const call of toolCalls) {
      let path = '';
      try {
        path = String((JSON.parse(call.function.arguments) as { path?: string }).path ?? '');
      } catch {
        // A malformed arguments blob is the model's mistake, not a crash: tell
        // it so in the tool result and let it recover on the next round.
      }
      if (path) onNavigate(path);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: path ? `The app is now showing ${path}.` : 'That page does not exist.',
      });
    }
  }

  return scrubMeta(reply).trim();
}

/** One request. Returns the spoken text plus any tool calls the model made. */
async function streamOnce(
  messages: WireMessage[],
  onText: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      // Short spoken answers over a fixed brief — there is nothing here worth
      // thinking hard about, and a pause before speaking reads as a hang.
      reasoning_effort: 'low',
      // gpt-oss reasons in a separate channel. Without this it can be folded
      // into the reply, and a visitor was shown the model talking to itself:
      // "(Note …). We need to respond properly, but user just asked to go to
      // Gallery page, we showed it. Now respond politely." Asking for it hidden
      // keeps that channel out of the text entirely.
      reasoning_format: 'hidden',
      max_tokens: 500,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new ChatError(await errorText(response), response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  // Tool calls arrive in fragments across deltas and are keyed by index, never
  // by id — the id only shows up on the first fragment.
  const calls = new Map<number, ToolCall>();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line; a frame can straddle two reads.
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;

      let delta: {
        // `reasoning` is gpt-oss thinking out loud. It is never shown and never
        // spoken — it is not an answer, and reading it aloud would be bizarre.
        content?: string | null;
        reasoning?: string | null;
        tool_calls?: {
          index: number;
          id?: string;
          function?: { name?: string; arguments?: string };
        }[];
      };
      try {
        delta = JSON.parse(payload).choices?.[0]?.delta ?? {};
      } catch {
        continue; // a partial frame that survived the split; the next read completes it
      }

      if (delta.content) {
        text += delta.content;
        // The whole thing, not the delta: scrubbing can only be decided on the
        // full text, and a stray note must be able to disappear again once the
        // model writes its real answer after it.
        onText(text);
      }

      for (const fragment of delta.tool_calls ?? []) {
        const existing = calls.get(fragment.index) ?? {
          id: '',
          type: 'function' as const,
          function: { name: '', arguments: '' },
        };
        if (fragment.id) existing.id = fragment.id;
        if (fragment.function?.name) existing.function.name = fragment.function.name;
        if (fragment.function?.arguments) existing.function.arguments += fragment.function.arguments;
        calls.set(fragment.index, existing);
      }
    }
  }

    const known = new Set(['show_page', 'start_tour']);
  return { text, toolCalls: [...calls.values()].filter((c) => known.has(c.function.name)) };
}

async function errorText(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

/** Turns a failure into something a visitor can read. */
export function explainError(error: unknown): string {
  if (error instanceof ChatError) {
    if (error.status === 401 || error.status === 403) {
      return 'The assistant is not set up correctly — its API key was rejected. Please tell the team.';
    }
    if (error.status === 429) {
      return 'A lot of people are asking at once. Give me a few seconds and ask again.';
    }
    return `The assistant failed with error ${error.status ?? ''}. Please try again.`;
  }
  if (error instanceof TypeError) {
    // fetch() rejects with a TypeError when it never reached the network.
    return 'I cannot reach the assistant right now — this device looks to be offline. The rest of the app still works.';
  }
  return 'Something went wrong on my side. Please try again.';
}
