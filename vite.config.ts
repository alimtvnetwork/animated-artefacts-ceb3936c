import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { lucidePerIcon } from "./vite-plugins/lucide-per-icon";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [lucidePerIcon(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Lift the warning bar — we explicitly chunk the heavy vendors below.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Vendor splits: keep the long-cached libs out of the main app
        // bundle so authoring changes don't bust their cache, and so a
        // first-paint hot-path slide (Title / Keyword) doesn't pay for
        // recharts/embla/mermaid/qrcode parse cost up front.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom')) return 'vendor-react';
          if (id.includes('/react/') || id.endsWith('/react') || id.includes('react/jsx')) return 'vendor-react';
          if (id.includes('framer-motion')) return 'vendor-framer';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('embla-carousel')) return 'vendor-embla';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('lucide-react')) return 'vendor-lucide';
          if (id.includes('qrcode') || id.includes('qrcode.react')) return 'vendor-qrcode';
          if (id.includes('@tanstack')) return 'vendor-tanstack';
          if (id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('zod')) return 'vendor-zod';
          // mermaid, shiki, katex, pptxgenjs are already dynamic-imported
          // from their slides — Rollup will emit separate chunks naturally.
          return undefined;
        },
      },
    },
  },
}));
