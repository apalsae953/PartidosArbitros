import { useEffect, useState } from 'react';
import { estaInstalada } from '../lib/dispositivo.js';

// El navegador puede ofrecer la instalación antes de que React arranque.
// Se escucha desde que se carga este módulo y se guarda la oferta para usarla después.
let ofertaPendiente = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    ofertaPendiente = evento;
  });
}

// Permite mostrar un botón "Instalar app" propio cuando el navegador lo admite (Chrome, Edge, Android)
export function usarInstalacion() {
  const [oferta, setOferta] = useState(() => ofertaPendiente);
  const [instalada, setInstalada] = useState(estaInstalada);

  useEffect(() => {
    function alOfrecerInstalacion(evento) {
      evento.preventDefault();
      setOferta(evento);
    }
    function alInstalar() {
      ofertaPendiente = null;
      setOferta(null);
      setInstalada(true);
    }
    window.addEventListener('beforeinstallprompt', alOfrecerInstalacion);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', alOfrecerInstalacion);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  async function instalar() {
    if (!oferta) return;
    oferta.prompt();
    await oferta.userChoice;
    // La oferta del navegador solo se puede usar una vez
    ofertaPendiente = null;
    setOferta(null);
  }

  return { puedeInstalar: Boolean(oferta) && !instalada, instalada, instalar };
}
