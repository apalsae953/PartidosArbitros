import Icono from './Icono.jsx';
import { DIAS_RECORDATORIO_COPIA } from '../lib/constantes.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Devuelve los días desde la última copia si toca recordarla, o null si no hace falta
export function diasSinCopia(ultimaCopia, numPartidos, ahora = Date.now()) {
  if (numPartidos === 0) return null;
  if (!ultimaCopia) return Infinity;
  const dias = Math.floor((ahora - ultimaCopia) / MS_POR_DIA);
  return dias >= DIAS_RECORDATORIO_COPIA ? dias : null;
}

export default function RecordatorioCopia({ dias, onExportar }) {
  return (
    <section
      aria-label="Recordatorio de copia de seguridad"
      className="flex items-center gap-3 rounded-2xl bg-white p-3 pl-4 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
        <Icono nombre="escudo" className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm text-slate-700">
        {dias === Infinity
          ? 'Aún no has guardado ninguna copia de tus partidos.'
          : `Hace ${dias} días que no guardas una copia.`}
      </p>
      <button
        type="button"
        onClick={onExportar}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white transition-[background-color,transform] duration-150 ease-salida hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/30 active:scale-[0.97]"
      >
        <Icono nombre="descargar" className="h-4 w-4" />
        Guardar
      </button>
    </section>
  );
}
