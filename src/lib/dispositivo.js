// La app está abierta como aplicación instalada (no dentro del navegador)
export function estaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// iPhone o iPad (los iPad recientes se identifican como Mac con pantalla táctil)
export function esIOS() {
  const { userAgent, platform, maxTouchPoints } = window.navigator;
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

// Pide al navegador que no borre los datos automáticamente cuando le falte espacio
export function pedirAlmacenamientoPersistente() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}
