import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'SRAS - Smart Resource Allocation System',
        short_name: 'SRAS',
        description: 'AI-powered crisis management and resource allocation platform',
        theme_color: '#0B1120',
        background_color: '#0B1120',
        display: 'standalone',
        icons: [
          { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /basemaps\.cartocdn\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
    }),
  ],
})
