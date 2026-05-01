import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "KINDRAIL",
        short_name: "KINDRAIL",
        description: "Daily battles, replays, shop, leaderboard, and share rewards.",
        theme_color: "#070a12",
        background_color: "#070a12",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      /** Same-origin API in dev; gateway must still run on 8787 (pnpm dev / dev:full). */
      "/__kr-api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__kr-api/, "")
      }
    }
  }
});

