import { useEffect } from 'react';
import Icono from './Icono.jsx';

// Aviso flotante breve. Si tiene una acción (por ejemplo "Deshacer") dura un poco más.
export default function Notificacion({ aviso, onCerrar }) {
  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(onCerrar, aviso.accion ? 6000 : 3500);
    return () => clearTimeout(temporizador);
  }, [aviso, onCerrar]);

  return (
    // La región existe siempre para que los lectores de pantalla anuncien cada aviso nuevo
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center sm:bottom-6">
      {aviso && (
        <div
          key={aviso.id}
          className="notificacion pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-slate-900 py-2 pl-4 pr-2 text-sm text-white shadow-xl shadow-slate-900/20"
        >
          <Icono nombre={aviso.icono || 'check'} className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="min-w-0 flex-1 py-1">{aviso.texto}</span>
          {aviso.accion && (
            <button
              type="button"
              onClick={() => {
                aviso.accion.alHacer();
                onCerrar();
              }}
              className="h-8 shrink-0 rounded-lg px-3 font-semibold text-emerald-300 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {aviso.accion.etiqueta}
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar aviso"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Icono nombre="cerrar" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
