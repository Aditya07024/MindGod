import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    // cloudflare(),
    tanstackStart({
      server: { entry: "server" },
      react: {
        customViteReactPlugin: true,
      },
    } as any),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],

  environments: {
    tanstack_start_app: {
      resolve: {
        external: [],
      },
    },
  },

  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: true,
  },

  resolve: {
    dedupe: ["react", "react-dom"],
  },

  optimizeDeps: {
    exclude: [
      "@tanstack/start-server-core",
      "@tanstack/react-start",
      "@tanstack/react-start/server",
      "@tanstack/react-start/client",
      "@tanstack/react-router",
    ],
    esbuildOptions: {
      external: [
        "#tanstack-router-entry",
        "#tanstack-start-entry",
        "#tanstack-start-plugin-adapters",
        "tanstack-start-manifest:v",
        "tanstack-start-injected-head-scripts:v"
      ]
    }
  },
});