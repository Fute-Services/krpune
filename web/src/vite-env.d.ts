/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// NOTE: triple-slash directives are only honoured at the very top of a file,
// before any other statement. They used to sit below the `declare module`
// lines, which meant TypeScript silently ignored them — hence the
// "Property 'env' does not exist on type 'ImportMeta'" errors.

declare module "*.jpg";
declare module "*.jpeg";
declare module "*.png";
declare module "*.svg";
declare module "*.css";

// Vite 8's `vite/client` no longer declares these, so state them explicitly
// rather than depending on whatever the bundler happens to ship.
interface ImportMetaEnv {
  /** The project guide's Groq key — the conversation and the microphone.
   *  Absent means the guide hides itself entirely; see chatbot/chatClient.ts. */
  readonly VITE_GROQ_API_KEY?: string;
  /** ElevenLabs voice key. Optional — without it the guide still speaks, using
   *  the browser's own synthesis. */
  readonly VITE_ELEVENLABS_API_KEY?: string;
  /** Optional ElevenLabs voice id; defaults to Sarah. */
  readonly VITE_ELEVENLABS_VOICE_ID?: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
