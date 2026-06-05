import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "foodpanda-tracker-app",
        short_name: "foodpanda-tracker-app",
        description: "A React web app with native iOS feel",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        scope: "/foodpanda-tracker-app/",
        start_url: "/foodpanda-tracker-app/",
        icons: [
          {
            src: "/foodpanda-tracker-app/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/foodpanda-tracker-app/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/foodpanda-tracker-app/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "offline-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  base: "/foodpanda-tracker-app/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
