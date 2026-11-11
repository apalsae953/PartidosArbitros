import Icono from './Icono.jsx';
import { TODAS_LAS_TEMPORADAS, nombreTemporada } from '../lib/temporadas.js';

// Líneas de un campo de fútbol como fondo decorativo de la cabecera
function LineasCampo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 260"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="pointer-events-none absolute -right-24 top-1/2 h-[150%] -translate-y-1/2 text-white/[0.06] sm:right-0"
    >
      <rect x="2" y="2" width="396" height="256" rx="4" />
      <line x1="200" y1="2" x2="200" y2="258" />
      <circle cx="200" cy="130" r="40" />
      <circle cx="200" cy="130" r="2.5" fill="currentColor" />
      <rect x="2" y="70" width="60" height="120" />
      <rect x="338" y="70" width="60" height="120" />
      <rect x="2" y="104" width="22" height="52" />
      <rect x="376" y="104" width="22" height="52" />
      <path d="M62 105a30 30 0 0 1 0 50" />
      <path d="M338 105a30 30 0 0 0 0 50" />
    </svg>
  );
}

export default function Cabecera({ temporada, temporadas, onCambiarTemporada, puedeInstalar, onInstalar, onNuevo }) {
  return (
    <header className="relative overflow-hidden bg-slate-950 pb-28 sm:pb-32">
      {/* Brillo verde suave detrás del título */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <LineasCampo />

      <div className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Icono nombre="bandera" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Mis Arbitrajes</h1>
            <p className="truncate text-sm text-slate-400">Control de partidos e ingresos</p>
          </div>

          {puedeInstalar && (
            <button
              type="button"
              onClick={onInstalar}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/15 transition-[background-color,transform] duration-150 ease-salida hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.97]"
            >
              <Icono nombre="movil" className="h-4 w-4" />
              <span className="hidden sm:inline">Instalar app</span>
              <span className="sm:hidden">Instalar</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNuevo}
            className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-[background-color,transform] duration-150 ease-salida hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 active:scale-[0.97] sm:inline-flex"
          >
            <Icono nombre="mas" className="h-4 w-4" />
            Nuevo partido
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <label htmlFor="temporada" className="sr-only">
            Temporada
          </label>
          <div className="relative">
            <select
              id="temporada"
              value={temporada}
              onChange={(e) => onCambiarTemporada(e.target.value)}
              className="h-9 cursor-pointer appearance-none rounded-full bg-white/10 py-0 pl-4 pr-9 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {temporadas.map((id) => (
                <option key={id} value={id} className="text-slate-900">
                  Temporada {nombreTemporada(id)}
                </option>
              ))}
              <option value={TODAS_LAS_TEMPORADAS} className="text-slate-900">
                Todas las temporadas
              </option>
            </select>
            <Icono
              nombre="chevronAbajo"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
