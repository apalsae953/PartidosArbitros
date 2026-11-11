import { useEffect, useId, useRef } from 'react';
import Icono from './Icono.jsx';

// Ventana modal con <dialog> nativo: bloquea el fondo, atrapa el foco y se cierra con Escape.
// En móvil se muestra como hoja inferior (ver .dialogo en index.css).
// "apertura" cambia cada vez que se abre, para volver arriba y enfocar el primer campo.
export default function VentanaModal({ abierto, apertura, titulo, onCerrar, children }) {
  const ref = useRef(null);
  const idTitulo = useId();
  // Para cerrar al pulsar fuera solo si el gesto empieza y termina en el fondo (no al seleccionar texto)
  const pulsadoEnFondo = useRef(false);

  useEffect(() => {
    const elemento = ref.current;
    if (abierto) {
      if (!elemento.open) elemento.showModal();
      elemento.firstElementChild.scrollTop = 0;
      // Con ratón se enfoca el primer campo; en móvil no, para no sacar el teclado de golpe
      if (window.matchMedia('(pointer: fine)').matches) elemento.querySelector('[data-autofoco]')?.focus();
    } else if (elemento.open) {
      elemento.close();
    }
  }, [abierto, apertura]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onPointerDown={(e) => {
        pulsadoEnFondo.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pulsadoEnFondo.current && e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="max-h-[inherit] overflow-y-auto overscroll-contain px-5 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-5">
        {/* Asa decorativa de la hoja inferior en móvil */}
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={idTitulo} className="text-lg font-semibold tracking-tight text-slate-900">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Icono nombre="cerrar" className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </dialog>
  );
}
