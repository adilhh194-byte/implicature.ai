import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function getPackageName(id) {
  const normalized = id.replace(/\\/g, '/')
  const parts = normalized.split('node_modules/')[1]?.split('/') ?? []

  if (parts[0]?.startsWith('@')) {
    return `${parts[0]}/${parts[1]}`
  }

  return parts[0]
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Implicature AI',
        short_name: 'Implicature',
        description: 'Extract Hidden Complaints from Reviews offline using NLP.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          const pkg = getPackageName(id)

          if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') {
            return 'react-vendor'
          }

          if (pkg === 'chart.js' || pkg === 'react-chartjs-2') {
            return 'charts'
          }

          if (pkg === 'jspdf') {
            return 'pdf-tools'
          }

          if (pkg === 'html2canvas') {
            return 'capture'
          }

          if (pkg === 'canvas-confetti') {
            return 'effects'
          }

          if (pkg === 'xlsx' || pkg === 'papaparse' || pkg === 'mammoth' || pkg === 'idb' || pkg === 'uuid') {
            return 'data-tools'
          }

          if (pkg === 'tesseract.js') {
            return 'ocr'
          }

          return 'vendor'
        }
      }
    }
  }
})
