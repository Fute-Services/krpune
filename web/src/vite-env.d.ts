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
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
