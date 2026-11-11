import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const raiz = fileURLToPath(new URL('.', import.meta.url));

// Avisa al compilar si faltan los datos del titular en las páginas legales
function comprobarDatosTitular() {
  return {
    name: 'comprobar-datos-titular',
    apply: 'build',
    buildStart() {
      const config = readFileSync(resolve(raiz, 'src/config/titular.js'), 'utf8');
      if (config.includes('COMPLETAR')) {
        this.warn(
          'Faltan tus datos en src/config/titular.js. Complétalos antes de publicar la app (aviso legal y privacidad).'
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    comprobarDatosTitular(),
    VitePWA({
      // Al publicar una versión nueva se muestra un aviso para actualizar (no se recarga sola)
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Mis Arbitrajes',
        short_name: 'Arbitrajes',
        description: 'Control de partidos e ingresos para árbitros.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f1f5f9',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Se guarda todo lo necesario para que la app funcione sin conexión
        globPatterns: ['**/*.{html,js,css,woff2,png,svg}'],
        // El lector de PDF (unos 1,8 MB) no se descarga al instalar: solo la primera vez que se usa
        globIgnores: ['**/assets/pdf*.{js,mjs}'],
        runtimeCaching: [
          {
            // Sus archivos llevan un código en el nombre que cambia con cada versión, así que se pueden guardar sin caducidad
            urlPattern: ({ url }) => url.origin === self.location.origin && /\/assets\/pdf.*\.m?js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'lector-pdf',
              expiration: { maxEntries: 6 },
            },
          },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Dos páginas: la app y la información legal
      input: {
        app: resolve(raiz, 'index.html'),
        legal: resolve(raiz, 'legal.html'),
      },
    },
  },
  test: {
    environment: 'node',
  },
});
