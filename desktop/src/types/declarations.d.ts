// This tells VS Code: "It's okay to import PDF files, treat them as strings"
declare module '*.pdf' {
  const src: string;
  export default src;
}
declare module "*.mp4" {
  const src: string;
  export default src;
}