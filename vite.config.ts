import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest: VitePWA встраивает precache-список в наш sw.js,
      // НЕ генерирует новый — так сохраняются push-обработчики
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'ORAZA - Крымскотатарское приложение',
        short_name: 'ORAZA',
        description: 'Приложение для крымских татар: расписание намазов, этно-календарь, обрядовый гид',
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        lang: 'ru',
        categories: ['lifestyle', 'religion', 'education'],
        icons: [
          { src: '/icon-72x72.png',   sizes: '72x72',   type: 'image/png', purpose: 'maskable any' },
          { src: '/icon-96x96.png',   sizes: '96x96',   type: 'image/png', purpose: 'maskable any' },
          { src: '/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'maskable any' },
          { src: '/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'maskable any' },
          { src: '/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'maskable any' },
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
          { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'maskable any' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 МБ
      },
      devOptions: {
        enabled: false, // В dev-режиме SW не нужен
      },
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR === 'true' ? false : {
      protocol: 'wss',
      clientPort: 443,
    },
  },
})
