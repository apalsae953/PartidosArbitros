// La app está abierta como aplicación instalada (no dentro del navegador)
export function estaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// iPhone o iPad (los iPad recientes se identifican como Mac con pantalla táctil)
export function esIOS(navegador = window.navigator) {
  const { userAgent, platform, maxTouchPoints } = navegador;
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

// Sistema y navegador, para explicar cómo instalar la app en cada caso.
// "integrado" son los navegadores dentro de otras apps (WhatsApp, Instagram, Facebook, Gmail, la app de Google...),
// desde los que no se puede instalar: hay que abrir la página en el navegador normal.
export function detectarPlataforma(navegador = window.navigator) {
  const ua = navegador.userAgent || '';
  const sistema = esIOS(navegador) ? 'ios' : /Android/i.test(ua) ? 'android' : 'escritorio';

  let nombre = 'otro';
  if (/FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|LinkedInApp|Twitter|GSA\/|; wv\)/i.test(ua)) nombre = 'integrado';
  else if (/SamsungBrowser/i.test(ua)) nombre = 'samsung';
  else if (/EdgiOS|EdgA\/|Edg\//.test(ua)) nombre = 'edge';
  else if (/FxiOS|Firefox\//.test(ua)) nombre = 'firefox';
  else if (/CriOS|Chrome\//.test(ua)) nombre = 'chrome';
  else if (/Safari\//.test(ua)) nombre = 'safari';

  return { sistema, navegador: nombre };
}

// Pide al navegador que no borre los datos automáticamente cuando le falte espacio
export function pedirAlmacenamientoPersistente() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}
