import { useMemo } from 'react';
import Icono from './Icono.jsx';
import { formatearCentimos, textoPartidos } from '../lib/formato.js';
import { nombreMes, nombreMesCorto, resumenMensual } from '../lib/temporadas.js';

// Barras apiladas (cobrado + pendiente) por mes de la temporada. Pulsar un mes filtra la lista.
export default function GraficoMensual({ partidos, temporada, mesSeleccionado, onSeleccionarMes }) {
  const meses = useMemo(() => resumenMensual(partidos, temporada), [partidos, temporada]);
  const maximo = Math.max(...meses.map((m) => m.cobrado + m.pendiente), 0);
  const detalle = mesSeleccionado ? meses.find((m) => m.mes === mesSeleccionado) : null;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Icono nombre="grafico" className="h-4 w-4 text-slate-400" />
            Ingresos por mes
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {detalle
              ? `${nombreMes(detalle.mes)} · ${textoPartidos(detalle.partidos)}`
              : 'Toca un mes para ver solo sus partidos'}
          </p>
        </div>
        {detalle && (
          <p className="cifras shrink-0 text-right text-sm font-semibold text-slate-900">
            {formatearCentimos(detalle.cobrado + detalle.pendiente)}
          </p>
        )}
      </div>

      {maximo === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Aún no hay partidos en esta temporada.
        </p>
      ) : (
        <>
          <div className="mt-4 grid h-32 grid-cols-12 items-end gap-1 sm:gap-1.5" role="group" aria-label="Meses de la temporada">
            {meses.map((m) => {
              const total = m.cobrado + m.pendiente;
              const seleccionado = m.mes === mesSeleccionado;
              const atenuado = mesSeleccionado && !seleccionado;
              return (
                <button
                  key={m.mes}
                  type="button"
                  disabled={total === 0}
                  aria-pressed={seleccionado}
                  aria-label={`${nombreMes(m.mes)}: ${formatearCentimos(total)}, ${formatearCentimos(m.cobrado)} cobrado`}
                  onClick={() => onSeleccionarMes(seleccionado ? null : m.mes)}
                  className="group flex h-full flex-col justify-end rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {total === 0 ? (
                    <span className="h-1 w-full rounded-full bg-slate-100" />
                  ) : (
                    <span
                      className={`flex w-full flex-col overflow-hidden rounded-md transition-opacity duration-200 group-hover:opacity-80 ${
                        atenuado ? 'opacity-30' : 'opacity-100'
                      }`}
                      style={{ height: `${Math.max((total / maximo) * 100, 4)}%` }}
                    >
                      <span className="w-full bg-amber-300" style={{ flexGrow: m.pendiente }} />
                      <span className="w-full bg-emerald-500" style={{ flexGrow: m.cobrado }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 grid grid-cols-12 gap-1 sm:gap-1.5" aria-hidden="true">
            {meses.map((m) => (
              <span
                key={m.mes}
                className={`text-center text-[10px] font-medium uppercase tracking-wide ${
                  m.mes === mesSeleccionado ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {/* En pantallas estrechas solo la inicial del mes */}
                <span className="sm:hidden">{nombreMesCorto(m.mes).charAt(0)}</span>
                <span className="hidden sm:inline">{nombreMesCorto(m.mes).slice(0, 3)}</span>
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Cobrado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Pendiente
            </span>
          </div>
        </>
      )}
    </section>
  );
}
