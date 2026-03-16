import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isWindows = process.platform === "win32";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: "./postcss.config.cjs",
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: isWindows,
      interval: isWindows ? 150 : undefined,
    },
    hmr: {
      host: "localhost",
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
  preview: {
    host: "localhost",
    port: 4173,
    strictPort: true,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
});
