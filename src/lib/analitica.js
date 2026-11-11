import { inject } from '@vercel/analytics';

// Vercel Web Analytics: cuenta visitas sin cookies ni identificadores guardados en el dispositivo.
// Solo funciona en la web publicada en Vercel (el script se sirve desde /_vercel/insights/ del propio dominio),
// así que en local no se carga.
export function activarAnalitica() {
  const enLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!import.meta.env.PROD || enLocal) return;
  inject({ mode: 'production' });
}
