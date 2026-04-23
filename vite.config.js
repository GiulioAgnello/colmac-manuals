import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Output in dist/ — committato nel plugin WP
    outDir: 'dist',
    // Unico bundle JS senza hash nel nome (WP lo versiona tramite filemtime)
    rollupOptions: {
      input:  'src/main.jsx',
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        // Nessun code splitting — un solo file per semplicità WP
        manualChunks: undefined,
      },
    },
    // Non generare index.html — è WP che gestisce il documento
    manifest: false,
  },
  // In dev, il proxy rimanda le chiamate API al WP locale
  server: {
    proxy: {
      '/wp-json': {
        target: 'http://localhost:8080',  // cambia con il tuo WP locale
        changeOrigin: true,
      },
    },
  },
})
