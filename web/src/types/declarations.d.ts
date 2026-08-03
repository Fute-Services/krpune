// This tells VS Code: "It's okay to import PDF files, treat them as strings"
declare module '*.pdf' {
  const src: string;
  export default src;
}
declare module "*.mp4" {
  const src: string;
  export default src;
}

// Swiper's stylesheets are imported by specifier, not by path — `swiper/css`
// resolves through the package's exports map to `swiper.css`. A plain CSS file
// carries no typings, so a side-effect import of it trips TS2882 ("Cannot find
// module or type declarations for side-effect import") on TypeScript versions
// that check those imports. The `*.css` wildcard in vite-env.d.ts doesn't cover
// these because the specifiers don't end in `.css`.
declare module "swiper/css";
declare module "swiper/css/*";
