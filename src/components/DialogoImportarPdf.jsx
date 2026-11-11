import { useState } from 'react';
import Icono from './Icono.jsx';
import VentanaModal from './VentanaModal.jsx';
import { ESTADOS, ETIQUETAS_ESTADO } from '../lib/constantes.js';
import { formatearCentimos, formatoFechaLarga, parsearFecha, textoPartidos } from '../lib/formato.js';

function Desglose({ desglose }) {
  const conceptos = [
    ['Arbitraje', desglose.arbitraje],
    ['Manutención', desglose.manutencion],
    ['Kilometraje', desglose.kilometraje],
  ].filter(([, importe]) => importe);
  if (conceptos.length < 2) return null;
  return (
    <p className="mt-1 text-xs text-slate-500">
      {conceptos.map(([nombre, importe]) => `${nombre} ${formatearCentimos(importe)}`).join(' + ')}
    </p>
  );
}

function ResultadoPdf({ resultado, seleccionado, onAlternar }) {
  if (!resultado.ok) {
    return (
      <li className="flex items-start gap-3 rounded-xl bg-red-50 p-3 ring-1 ring-inset ring-red-200">
        <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-red-800">{resultado.archivo}</p>
          <p className="text-xs text-red-700">{resultado.motivo}</p>
        </div>
      </li>
    );
  }

  const { partido, desglose, avisos, duplicado } = resultado;
  return (
    <li>
      <label
        className={`flex cursor-pointer gap-3 rounded-xl p-3 ring-1 ring-inset transition-colors ${
          duplicado ? 'cursor-not-allowed bg-slate-50 ring-slate-200' : seleccionado ? 'bg-emerald-50/60 ring-emerald-300' : 'ring-slate-200 hover:bg-slate-50'
        }`}
      >
        <input
          type="checkbox"
          checked={seleccionado}
          disabled={duplicado}
          onChange={onAlternar}
          className="mt-0.5 h-5 w-5 shrink-0 rounded accent-emerald-600"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="text-xs font-medium text-slate-500 first-letter:uppercase">
              {formatoFechaLarga.format(parsearFecha(partido.fecha))} · {partido.hora}
            </span>
            <span className="cifras shrink-0 font-semibold text-slate-900">{formatearCentimos(partido.importeCentimos)}</span>
          </span>
          <span className="mt-1 block font-medium leading-snug text-slate-900">
            {partido.local} <span className="font-normal text-slate-400">–</span> {partido.visitante}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {partido.categoria}
            {partido.designacion && <> · Nº {partido.designacion}</>}
          </span>
          <Desglose desglose={desglose} />
          {duplicado && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              <Icono nombre="check" className="h-3 w-3" />
              Ya está registrado
            </span>
          )}
          {avisos.map((aviso) => (
            <span key={aviso} className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
              <Icono nombre="alerta" className="mt-px h-3.5 w-3.5 shrink-0" />
              {aviso}
            </span>
          ))}
        </span>
      </label>
    </li>
  );
}

// Vista previa de los partidos leídos de los PDF antes de añadirlos
export default function DialogoImportarPdf({ importacion, onConfirmar, onCerrar }) {
  const { abierto, apertura, cargando, resultados, numArchivos } = importacion;
  // Por defecto se marcan los partidos leídos bien que no estén ya registrados
  const [desmarcados, setDesmarcados] = useState(() => new Set());
  const [estado, setEstado] = useState(ESTADOS.PENDIENTE);
  const [aperturaVista, setAperturaVista] = useState(apertura);

  // Cada nueva importación empieza con todo marcado y "Pendiente"
  if (apertura !== aperturaVista) {
    setAperturaVista(apertura);
    setDesmarcados(new Set());
    setEstado(ESTADOS.PENDIENTE);
  }

  const importables = resultados.filter((r) => r.ok && !r.duplicado);
  const seleccionados = importables.filter((r) => !desmarcados.has(r.id));

  function alternar(id) {
    setDesmarcados((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(id)) nuevos.delete(id);
      else nuevos.add(id);
      return nuevos;
    });
  }

  return (
    <VentanaModal abierto={abierto} apertura={apertura} titulo="Importar desde PDF" onCerrar={onCerrar}>
      {cargando ? (
        <div className="flex flex-col items-center py-12 text-center" role="status">
          <Icono nombre="cargando" className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-4 text-sm font-medium text-slate-900">
            Leyendo {numArchivos === 1 ? 'el PDF' : `${numArchivos} PDF`}…
          </p>
          <p className="mt-1 text-xs text-slate-500">Todo se procesa en tu dispositivo.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {resultados.map((resultado) => (
              <ResultadoPdf
                key={resultado.id}
                resultado={resultado}
                seleccionado={resultado.ok && !resultado.duplicado && !desmarcados.has(resultado.id)}
                onAlternar={() => alternar(resultado.id)}
              />
            ))}
          </ul>

          {importables.length > 0 && (
            <fieldset className="mt-5">
              <legend className="mb-1.5 block text-sm font-medium text-slate-700">Estado de cobro</legend>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {[ESTADOS.PENDIENTE, ESTADOS.COBRADO].map((opcion) => {
                  const activo = estado === opcion;
                  return (
                    <label
                      key={opcion}
                      className={`flex h-9 cursor-pointer items-center justify-center rounded-md text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                        activo
                          ? `bg-white shadow-sm ${opcion === ESTADOS.COBRADO ? 'text-emerald-700' : 'text-amber-700'}`
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="estado-importacion"
                        value={opcion}
                        checked={activo}
                        onChange={() => setEstado(opcion)}
                        className="sr-only"
                      />
                      {ETIQUETAS_ESTADO[opcion]}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Podrás editar cualquier dato después tocando el partido en la lista.
              </p>
            </fieldset>
          )}

          <button
            type="button"
            disabled={seleccionados.length === 0}
            onClick={() => onConfirmar(seleccionados.map((r) => r.partido), estado)}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-salida hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:active:scale-100"
          >
            <Icono nombre="check" className="h-4 w-4" />
            {seleccionados.length === 0
              ? 'Nada que añadir'
              : `Añadir ${textoPartidos(seleccionados.length)}`}
          </button>
        </>
      )}
    </VentanaModal>
  );
}
