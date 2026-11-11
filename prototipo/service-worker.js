// Service worker básico: permite instalar la app y usarla sin conexión.
// Al cambiar cualquier archivo de la app, sube la versión para que los móviles descarguen la nueva.
const VERSION = 'v2';
const CACHE = `arbitrajes-${VERSION}`;

// Archivos propios de la app
const ARCHIVOS_LOCALES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg',
];

// Librerías externas. El modo debe coincidir con cómo las pide index.html
// (las de unpkg llevan crossorigin; Tailwind no), o la caché no servirá la respuesta.
const ARCHIVOS_EXTERNOS = [
  { url: 'https://cdn.tailwindcss.com', modo: 'no-cors' },
  { url: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js', modo: 'cors' },
  { url: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js', modo: 'cors' },
  { url: 'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js', modo: 'no-cors' },
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ARCHIVOS_LOCALES);
      // Si alguna librería externa falla, la instalación sigue y se guardará en el primer uso
      await Promise.allSettled(
        ARCHIVOS_EXTERNOS.map(async ({ url, modo }) => {
          const respuesta = await fetch(new Request(url, { mode: modo }));
          if (respuesta.ok || respuesta.type === 'opaque') await cache.put(url, respuesta);
        })
      );
      await self.skipWaiting();
    })()
  );
});

// Elimina las cachés de versiones anteriores
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((nombre) => nombre !== CACHE).map((nombre) => caches.delete(nombre)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;

  // Páginas: primero la red (para recibir actualizaciones) y, sin conexión, la copia guardada
  if (request.mode === 'navigate') {
    evento.respondWith(
      (async () => {
        try {
          const respuesta = await fetch(request);
          if (respuesta.ok) {
            const cache = await caches.open(CACHE);
            cache.put('./index.html', respuesta.clone());
          }
          return respuesta;
        } catch {
          return (await caches.match('./index.html')) || Response.error();
        }
      })()
    );
    return;
  }

  // Resto de recursos: primero la caché y, si no está, la red (y se guarda para la próxima vez)
  evento.respondWith(
    (async () => {
      const enCache = await caches.match(request);
      if (enCache) return enCache;
      try {
        const respuesta = await fetch(request);
        if (respuesta.ok || respuesta.type === 'opaque') {
          const cache = await caches.open(CACHE);
          cache.put(request, respuesta.clone());
        }
        return respuesta;
      } catch {
        return Response.error();
      }
    })()
  );
});
