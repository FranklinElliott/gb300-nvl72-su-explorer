import path from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Standalone static SPA build for GitHub Pages.
 * Avoids TanStack Start SSR / Nitro (not deployable to pure static hosting).
 */
export default defineConfig({
  root: path.resolve(__dirname, "pages-site"),
  base: "/gb300-nvl72-su-explorer/",
  publicDir: false,
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist-pages"),
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
  },
});
