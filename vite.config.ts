import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/ ========
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "^/api/wled/(?:json(?:/state)?|presets\\.json)(?:\\?|$)": {
        target: "http://192.168.29.40",
        changeOrigin: true,
        proxyTimeout: 3500,
        rewrite: (p) => p.replace(/^\/api\/wled/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
