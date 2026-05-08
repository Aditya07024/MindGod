import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import {cloudflare} from "@cloudflare/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    cloudflare(),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        // Reduce chunk sizes to improve memory usage
      },
    },
    // Reduce source map size in production
    sourcemap: false,
    // Increase chunk size warning threshold
    chunkSizeWarningLimit: 1000,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    middlewareMode: true,
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
