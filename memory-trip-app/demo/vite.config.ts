// Builds the GitHub Pages demo: `npm run demo:build` -> memory-trip-app/dist-demo.
// Docs: https://vite.dev/config/
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here("."),
  // GitHub Pages serves a project site under /<repository-name>/. Override with DEMO_BASE.
  base: process.env.DEMO_BASE ?? "/Project-Web-Japan/",
  plugins: [react()],
  // Tailwind runs through the project's own postcss.config.mjs (one level up).
  css: { postcss: here("..") },
  resolve: {
    alias: [
      // The real components import Next.js modules; the demo swaps in tiny stand-ins.
      { find: /^next\/link$/, replacement: here("./src/shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: here("./src/shims/next-navigation.ts") },
      { find: /^@\//, replacement: `${here("..")}/` },
    ],
  },
  build: {
    outDir: here("../dist-demo"),
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
  },
  server: { port: 5174 },
});
