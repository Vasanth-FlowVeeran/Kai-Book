import { defineConfig } from "vite";
import { resolve } from "path";

// https://v2.tauri.app/start/frontend/vite/
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  root: "src",
  publicDir: resolve(__dirname, "src/public"),
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        tray: resolve(__dirname, "src/tray.html"),
      },
    },
  },

  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    // Tauri expects a fixed port; fail if it's already in use
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
