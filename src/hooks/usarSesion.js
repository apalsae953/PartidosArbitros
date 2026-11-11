import { useEffect, useState } from 'react';
import { CUENTAS_DISPONIBLES } from '../config/firebase.js';

// Estado de la cuenta del usuario:
// - "sin-cuentas": la app no tiene Firebase configurado (solo datos del dispositivo)
// - "comprobando": cargando Firebase y recuperando la sesión guardada
// - "invitado": sin sesión iniciada (datos del dispositivo)
// - "conectado": con sesión (datos en la nube)
export function usarSesion() {
  const [estado, setEstado] = useState(CUENTAS_DISPONIBLES ? 'comprobando' : 'sin-cuentas');
  const [usuario, setUsuario] = useState(null);
  const [servicio, setServicio] = useState(null);

  useEffect(() => {
    if (!CUENTAS_DISPONIBLES) return;
    let cancelado = false;
    let dejarDeObservar = () => {};

    import('../lib/nube/servicio.js')
      .then((modulo) => {
        if (cancelado) return;
        setServicio(modulo);
        dejarDeObservar = modulo.observarSesion((datos) => {
          setUsuario(datos);
          setEstado(datos ? 'conectado' : 'invitado');
        });
      })
      .catch((error) => {
        // Sin Firebase (por ejemplo, primera visita sin conexión) la app sigue funcionando en local
        console.warn('No se pudo cargar el servicio de cuentas', error);
        if (!cancelado) setEstado('invitado');
      });

    return () => {
      cancelado = true;
      dejarDeObservar();
    };
  }, []);

  return { estado, usuario, servicio };
}
