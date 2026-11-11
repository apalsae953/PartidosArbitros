import { useMemo } from 'react';
import Icono from './Icono.jsx';
import { ESTADOS } from '../lib/constantes.js';
import { formatearCentimos, formatoDia, formatoFechaLarga, parsearFecha, textoPartidos } from '../lib/formato.js';
import { agruparPorMes, nombreMes } from '../lib/temporadas.js';

const formatoDiaSemana = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });

const FILTROS_ESTADO = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: ESTADOS.PENDIENTE, etiqueta: 'Pendientes' },
  { valor: ESTADOS.COBRADO, etiqueta: 'Cobrados' },
];

function FilaPartido({ partido, resaltado, onEditar, onAlternarEstado }) {
  const cobrado = partido.estado === ESTADOS.COBRADO;
  const fecha = parsearFecha(partido.fecha);

  return (
    <li
      data-partido={partido.id}
      className={`group relative flex items-center gap-1 rounded-xl transition-colors hover:bg-slate-50 ${
        resaltado ? 'animate-resaltar' : ''
      }`}
    >
      {/* Toda la fila abre el partido para editarlo */}
      <button
        type="button"
        onClick={() => onEditar(partido)}
        title={formatoFechaLarga.format(fecha)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-3 pl-2 pr-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:gap-4 sm:pl-3"
      >
        <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-slate-100 py-1.5 leading-none">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {formatoDiaSemana.format(fecha).replace('.', '')}
          </span>
          <span className="cifras mt-1 text-lg font-semibold text-slate-900">{formatoDia.format(fecha)}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 break-words font-medium leading-snug text-slate-900">
            {partido.local} <span className="font-normal text-slate-400">–</span> {partido.visitante}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            <span className="truncate">{partido.categoria}</span>
            {partido.hora && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="cifras shrink-0">{partido.hora}</span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className={`shrink-0 font-medium ${cobrado ? 'text-emerald-700' : 'text-amber-700'}`}>
              {cobrado ? 'Cobrado' : 'Pendiente'}
            </span>
          </span>
        </span>

        <span className="cifras shrink-0 text-right font-semibold text-slate-900">
          {formatearCentimos(partido.importeCentimos)}
        </span>
      </button>

      {/* Acción rápida: cobrar o volver a pendiente sin abrir el partido */}
      <button
        type="button"
        onClick={() => onAlternarEstado(partido.id)}
        aria-label={cobrado ? `Marcar como pendiente: ${partido.local} – ${partido.visitante}` : `Marcar como cobrado: ${partido.local} – ${partido.visitante}`}
        title={cobrado ? 'Marcar como pendiente' : 'Marcar como cobrado'}
        className={`mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 ease-salida focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-90 sm:mr-2 ${
          cobrado
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-300'
        }`}
      >
        <Icono nombre="check" className="h-4 w-4" />
      </button>
    </li>
  );
}

function EstadoVacio({ onNuevo, onImportarPdf }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10">
        <Icono nombre="bandera" className="h-7 w-7" />
      </span>
      <p className="mt-5 text-base font-semibold text-slate-900">Tu temporada empieza aquí</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Registra cada partido que arbitres y lleva al día lo que has cobrado y lo que te deben.
      </p>
      <button
        type="button"
        onClick={onNuevo}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-salida hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/30 active:scale-[0.97]"
      >
        <Icono nombre="mas" className="h-4 w-4" />
        Añadir mi primer partido
      </button>
      <button
        type="button"
        onClick={onImportarPdf}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
      >
        <Icono nombre="documento" className="h-4 w-4" />o impórtalo desde el PDF de designación
      </button>
    </div>
  );
}

export default function ListaPartidos({
  partidos,
  hayPartidos,
  cargando,
  filtros,
  onCambiarFiltros,
  onQuitarFiltros,
  resaltadoId,
  onEditar,
  onAlternarEstado,
  onNuevo,
  onImportarPdf,
}) {
  const grupos = useMemo(() => agruparPorMes(partidos), [partidos]);
  const hayFiltros = filtros.mes || filtros.estado !== 'todos' || filtros.busqueda;

  return (
    <section
      id="lista-partidos"
      className="scroll-mt-4 rounded-2xl bg-white shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5"
    >
      <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Partidos</h2>
          {hayPartidos && <span className="cifras text-sm text-slate-500">{textoPartidos(partidos.length)}</span>}
        </div>

        {hayPartidos && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Icono
                nombre="buscar"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <label htmlFor="buscar" className="sr-only">
                Buscar por equipo o categoría
              </label>
              <input
                id="buscar"
                type="search"
                autoComplete="off"
                placeholder="Buscar equipo o categoría"
                value={filtros.busqueda}
                onChange={(e) => onCambiarFiltros({ busqueda: e.target.value })}
                className="h-10 w-full rounded-lg border-0 bg-slate-100 pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
              />
            </div>

            <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Filtrar por estado">
              {FILTROS_ESTADO.map(({ valor, etiqueta }) => {
                const activo = filtros.estado === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => onCambiarFiltros({ estado: valor })}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:flex-none ${
                      activo ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {etiqueta}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filtros.mes && (
          <button
            type="button"
            onClick={() => onCambiarFiltros({ mes: null })}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 py-1 pl-3 pr-2 text-xs font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {nombreMes(filtros.mes)}
            <Icono nombre="cerrar" className="h-3.5 w-3.5" />
            <span className="sr-only">Quitar filtro de mes</span>
          </button>
        )}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-slate-500" role="status">
          <Icono nombre="cargando" className="h-5 w-5 animate-spin text-emerald-600" />
          Cargando tus partidos…
        </div>
      ) : !hayPartidos ? (
        <EstadoVacio onNuevo={onNuevo} onImportarPdf={onImportarPdf} />
      ) : grupos.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-slate-500">
            {hayFiltros ? 'Ningún partido coincide con los filtros.' : 'No hay partidos en esta temporada.'}
          </p>
          {hayFiltros && (
            <button
              type="button"
              onClick={onQuitarFiltros}
              className="mt-3 text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              Quitar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="px-2 pb-2 sm:px-3">
          {grupos.map((grupo) => (
            <div key={grupo.mes}>
              <div className="flex items-baseline justify-between gap-3 px-2 pb-1 pt-4 sm:px-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{nombreMes(grupo.mes)}</h3>
                <p className="cifras text-xs text-slate-500">
                  {textoPartidos(grupo.partidos.length)} · {formatearCentimos(grupo.total)}
                </p>
              </div>
              <ul className="divide-y divide-slate-100">
                {grupo.partidos.map((partido) => (
                  <FilaPartido
                    key={partido.id}
                    partido={partido}
                    resaltado={partido.id === resaltadoId}
                    onEditar={onEditar}
                    onAlternarEstado={onAlternarEstado}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
