// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Reduce chunk sizes to improve memory usage
          manualChunks: {
            vendor: ["react", "react-dom", "@tanstack/react-router"],
            charts: ["recharts", "d3"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          },
        },
      },
      // Reduce source map size in production
      sourcemap: false,
      // Increase chunk size warning threshold
      chunkSizeWarningLimit: 1000,
    },
    server: {
      middlewareMode: true,
    },
    optimization: {
      lib: {
        entry: "./src/index.ts",
        formats: ["es"],
      },
    },
  },
});
