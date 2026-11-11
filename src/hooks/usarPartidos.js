import { useCallback, useEffect, useRef, useState } from 'react';
import { cargarPartidos, guardarPartidos } from '../lib/almacenamiento.js';
import { CLAVE_PARTIDOS } from '../lib/constantes.js';
import { calcularCambios } from '../lib/nube/cambios.js';
import { mensajeError } from '../lib/nube/errores.js';

// Lista de partidos y forma de cambiarla, igual para los dos modos:
// - Sin sesión: se guardan en el dispositivo (localStorage).
// - Con sesión: se guardan en la nube (Firestore), que además mantiene copia en el dispositivo.
export function usarPartidos(sesion, alFallar) {
  const enNube = sesion.estado === 'conectado' && sesion.servicio;
  const uid = sesion.usuario?.uid;
  const [partidos, setPartidos] = useState(cargarPartidos);
  const [errorGuardado, setErrorGuardado] = useState(false);
  // Estado de la sincronización con la nube: cargando la primera vez y cambios pendientes de subir
  const [nube, setNube] = useState({ cargando: false, pendientes: false, sinConexion: false });
  // Copia síncrona de la lista, para calcular cambios seguidos sin esperar a que React vuelva a pintar
  const refPartidos = useRef(partidos);
  // De dónde viene la lista que hay en pantalla. Evita copiar los partidos de la nube al dispositivo
  // en el instante en que se cierra la sesión (y dejarlos a la vista en un dispositivo compartido).
  const refOrigen = useRef('dispositivo');
  const refAlFallar = useRef(alFallar);
  refAlFallar.current = alFallar;

  // Modo dispositivo: se guarda cada cambio y se sincroniza con otras pestañas
  useEffect(() => {
    if (enNube || refOrigen.current !== 'dispositivo') return;
    setErrorGuardado(!guardarPartidos(partidos));
  }, [partidos, enNube]);

  useEffect(() => {
    if (enNube) return;
    function alCambiarAlmacenamiento(evento) {
      if (evento.key === null || evento.key === CLAVE_PARTIDOS) {
        const lista = cargarPartidos();
        refPartidos.current = lista;
        setPartidos(lista);
      }
    }
    window.addEventListener('storage', alCambiarAlmacenamiento);
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento);
  }, [enNube]);

  // Modo nube: la lista sale de la base de datos y se actualiza sola (también desde otros dispositivos)
  useEffect(() => {
    if (!enNube) {
      // Al no haber sesión se vuelve a los datos del dispositivo
      const lista = cargarPartidos();
      refOrigen.current = 'dispositivo';
      refPartidos.current = lista;
      setPartidos(lista);
      return undefined;
    }
    refOrigen.current = 'nube';
    setErrorGuardado(false);
    setNube({ cargando: true, pendientes: false, sinConexion: false });
    refPartidos.current = [];
    setPartidos([]);
    return sesion.servicio.observarPartidos(
      uid,
      (lista, estado) => {
        refPartidos.current = lista;
        setPartidos(lista);
        setNube({ cargando: false, ...estado });
      },
      (error) => {
        console.warn('Error al leer los partidos de la nube', error);
        setNube((actual) => ({ ...actual, cargando: false }));
        refAlFallar.current?.(mensajeError(error));
      }
    );
  }, [enNube, uid, sesion.servicio]);

  // Aplica un cambio a la lista (función o lista nueva) y, con sesión, lo sube a la nube
  const cambiarPartidos = useCallback(
    (cambio) => {
      const anteriores = refPartidos.current;
      const nuevos = typeof cambio === 'function' ? cambio(anteriores) : cambio;
      if (nuevos === anteriores) return;
      refPartidos.current = nuevos;
      setPartidos(nuevos);
      if (enNube) {
        sesion.servicio.guardarCambios(uid, calcularCambios(anteriores, nuevos), (error) => {
          console.warn('Error al guardar en la nube', error);
          refAlFallar.current?.(mensajeError(error));
        });
      }
    },
    [enNube, uid, sesion.servicio]
  );

  return { partidos, cambiarPartidos, errorGuardado, nube, enNube: Boolean(enNube) };
}
