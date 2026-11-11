import { useMemo } from 'react';
import Icono from './Icono.jsx';
import { ESTADOS } from '../lib/constantes.js';
import { formatearCentimos, textoPartidos } from '../lib/formato.js';

export function calcularResumen(partidos) {
  let total = 0;
  let cobrado = 0;
  let numPendientes = 0;
  for (const partido of partidos) {
    total += partido.importeCentimos;
    if (partido.estado === ESTADOS.COBRADO) cobrado += partido.importeCentimos;
    else numPendientes += 1;
  }
  return {
    total,
    cobrado,
    pendiente: total - cobrado,
    numPendientes,
    porcentajeCobrado: total > 0 ? Math.round((cobrado / total) * 100) : 0,
  };
}

function Tarjeta({ titulo, icono, claseIcono, className = '', children }) {
  return (
    <article className={`flex flex-col rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${claseIcono}`}>
          <Icono nombre={icono} className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-medium text-slate-500">{titulo}</h3>
      </div>
      {children}
    </article>
  );
}

export default function PanelEstadisticas({ partidos, etiquetaPeriodo, onVerPendientes }) {
  const resumen = useMemo(() => calcularResumen(partidos), [partidos]);
  const media = partidos.length > 0 ? Math.round(resumen.total / partidos.length) : 0;

  return (
    <section aria-label="Resumen de ingresos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <Tarjeta
        titulo="Generado"
        icono="cartera"
        claseIcono="bg-slate-900 text-white"
        className="col-span-2 sm:col-span-1"
      >
        <p className="cifras mt-3 text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
          {formatearCentimos(resumen.total)}
        </p>
        <p className="mt-auto pt-2 text-xs text-slate-500">
          {etiquetaPeriodo} · {textoPartidos(partidos.length)}
          {partidos.length > 0 && <> · media {formatearCentimos(media)}</>}
        </p>
      </Tarjeta>

      <Tarjeta titulo="Cobrado" icono="circuloCheck" claseIcono="bg-emerald-50 text-emerald-600">
        <p className="cifras mt-3 text-xl font-semibold tracking-tight text-emerald-600 sm:text-2xl lg:text-3xl">
          {formatearCentimos(resumen.cobrado)}
        </p>
        <div className="mt-auto pt-3">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Porcentaje cobrado"
            aria-valuenow={resumen.porcentajeCobrado}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full w-full origin-left rounded-full bg-emerald-500 transition-transform duration-500 ease-salida"
              style={{ transform: `scaleX(${resumen.porcentajeCobrado / 100})` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{resumen.porcentajeCobrado} % del total</p>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Pendiente" icono="reloj" claseIcono="bg-amber-50 text-amber-600">
        <p className="cifras mt-3 text-xl font-semibold tracking-tight text-amber-600 sm:text-2xl lg:text-3xl">
          {formatearCentimos(resumen.pendiente)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-slate-500">
          <span>
            {partidos.length === 0
              ? 'Sin partidos'
              : resumen.numPendientes === 0
                ? 'Todo cobrado'
                : `${textoPartidos(resumen.numPendientes)} por cobrar`}
          </span>
          {resumen.numPendientes > 0 && (
            <button
              type="button"
              onClick={onVerPendientes}
              className="-my-1 inline-flex shrink-0 items-center rounded-md px-1.5 py-1 font-medium text-amber-700 transition-colors hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Ver
              <Icono nombre="chevronDerecha" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Tarjeta>
    </section>
  );
}
