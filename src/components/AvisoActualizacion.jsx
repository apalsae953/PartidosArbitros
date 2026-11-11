import { useRegisterSW } from 'virtual:pwa-register/react';
import Icono from './Icono.jsx';

// Registra el service worker y, si hay una versión nueva publicada, muestra una franja arriba.
// No se recarga sola para no perder lo que el usuario esté escribiendo.
export default function AvisoActualizacion() {
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('No se pudo registrar el service worker', error);
    },
  });

  if (!hayVersionNueva) return null;

  return (
    <div role="status" className="bg-emerald-400 text-slate-950">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm sm:px-6">
        <Icono nombre="actualizar" className="h-4 w-4 shrink-0" />
        <span className="flex-1 font-medium">Hay una versión nueva de la app.</span>
        <button
          type="button"
          onClick={() => setHayVersionNueva(false)}
          className="h-8 rounded-lg px-2 font-medium transition-colors hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        >
          Luego
        </button>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="h-8 rounded-lg bg-slate-950 px-3 font-semibold text-white transition-[background-color,transform] duration-150 ease-salida hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.97]"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
