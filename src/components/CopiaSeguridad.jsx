import { useRef, useState } from 'react';
import Icono from './Icono.jsx';
import { exportarCSV, leerCopia } from '../lib/copiaSeguridad.js';
import { textoPartidos } from '../lib/formato.js';

// Tamaño máximo del archivo a importar (una temporada entera ocupa unos pocos KB)
const MAX_BYTES_IMPORTACION = 5 * 1024 * 1024;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// "hoy", "ayer", "hace 5 días"...
export function textoUltimaCopia(momento, ahora = Date.now()) {
  if (!momento) return 'nunca';
  const inicioHoy = new Date(ahora).setHours(0, 0, 0, 0);
  const dias = Math.ceil((inicioHoy - momento) / MS_POR_DIA);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

export default function CopiaSeguridad({ partidos, ultimaCopia, onExportarJSON, onImportar, onVerAviso, cuenta, onCuenta }) {
  const hayDatos = partidos.length > 0;
  const refArchivo = useRef(null);
  // Copia leída del archivo, pendiente de que el usuario confirme cómo importarla
  const [importacion, setImportacion] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  async function alElegirArchivo(evento) {
    const archivo = evento.target.files[0];
    // Se vacía el selector para poder volver a elegir el mismo archivo
    evento.target.value = '';
    if (!archivo) return;
    setMensaje(null);
    setImportacion(null);

    if (archivo.size > MAX_BYTES_IMPORTACION) {
      setMensaje({ tipo: 'error', texto: 'El archivo es demasiado grande para ser una copia de esta app.' });
      return;
    }

    try {
      const { partidos: importados, descartados } = leerCopia(await archivo.text());
      if (importados.length === 0) {
        setMensaje({ tipo: 'error', texto: 'El archivo no contiene ningún partido válido.' });
        return;
      }
      const idsActuales = new Set(partidos.map((p) => p.id));
      setImportacion({
        nombre: archivo.name,
        partidos: importados,
        nuevos: importados.filter((p) => !idsActuales.has(p.id)).length,
        descartados,
      });
    } catch (error) {
      console.warn('No se pudo leer la copia', error);
      setMensaje({ tipo: 'error', texto: 'No se pudo leer el archivo. Elige una copia .json exportada desde esta app.' });
    }
  }

  function confirmarImportacion(modo) {
    onImportar(importacion.partidos, modo);
    setMensaje({
      tipo: 'exito',
      texto:
        modo === 'reemplazar'
          ? `Copia restaurada: ${textoPartidos(importacion.partidos.length)}.`
          : `Se han añadido ${textoPartidos(importacion.nuevos)}.`,
    });
    setImportacion(null);
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icono nombre="escudo" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">Tus datos</h2>
          {cuenta?.enNube ? (
            <p className="mt-0.5 text-sm text-slate-500">
              Guardados en tu cuenta <span className="font-medium text-slate-700">{cuenta.email}</span>: los ves en
              todos tus dispositivos.
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-500">
              Se guardan solo en este dispositivo. Última copia:{' '}
              <span className={`font-medium ${ultimaCopia ? 'text-slate-700' : 'text-amber-700'}`}>
                {textoUltimaCopia(ultimaCopia)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Sin sesión: invitación a crear cuenta para no depender del navegador */}
      {cuenta && !cuenta.enNube && (
        <button
          type="button"
          onClick={onCuenta}
          className="mt-4 flex w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-left ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Icono nombre="nube" className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold text-slate-900">Guárdalos en la nube</span>
            <span className="block text-xs text-slate-500">Crea una cuenta gratis y velos en el móvil y el ordenador</span>
          </span>
          <Icono nombre="chevronDerecha" className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      )}

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={onExportarJSON}
          disabled={!hayDatos}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-salida hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          <Icono nombre="descargar" className="h-4 w-4" />
          Exportar copia de seguridad
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => exportarCSV(partidos)}
            disabled={!hayDatos}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition-[background-color,transform] duration-150 ease-salida hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            <Icono nombre="hojaCalculo" className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={() => refArchivo.current.click()}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition-[background-color,transform] duration-150 ease-salida hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98]"
          >
            <Icono nombre="subir" className="h-4 w-4" />
            Importar
          </button>
        </div>
        <input ref={refArchivo} type="file" accept=".json,application/json" onChange={alElegirArchivo} className="hidden" />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        La copia (.json) se puede volver a importar; el archivo de Excel (.csv) es solo para consultar.{' '}
        <button
          type="button"
          onClick={onVerAviso}
          className="font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
        >
          Más información
        </button>
      </p>

      {/* Confirmación antes de tocar los datos actuales */}
      {importacion && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
          <p className="break-all text-sm font-medium text-slate-900">{importacion.nombre}</p>
          <p className="mt-1 text-sm text-slate-600">
            Contiene {textoPartidos(importacion.partidos.length)}
            {hayDatos && `, de los que ${importacion.nuevos === 1 ? '1 es nuevo' : `${importacion.nuevos} son nuevos`}`}.
            {importacion.descartados > 0 && ` Se ignorarán ${importacion.descartados} registros no válidos o repetidos.`}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {hayDatos ? (
              <>
                <button
                  type="button"
                  onClick={() => confirmarImportacion('combinar')}
                  disabled={importacion.nuevos === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icono nombre="mas" className="h-4 w-4" />
                  Añadir los nuevos
                </button>
                <button
                  type="button"
                  onClick={() => confirmarImportacion('reemplazar')}
                  className="h-9 rounded-lg bg-white px-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Reemplazar todo
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => confirmarImportacion('reemplazar')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
              >
                <Icono nombre="subir" className="h-4 w-4" />
                Restaurar copia
              </button>
            )}
            <button
              type="button"
              onClick={() => setImportacion(null)}
              className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancelar
            </button>
          </div>

          {hayDatos && (
            <p className="mt-3 text-xs text-slate-500">
              «Reemplazar todo» borra los {textoPartidos(partidos.length)} actuales y deja solo los del archivo.
            </p>
          )}
        </div>
      )}

      {mensaje && (
        <p
          role="status"
          className={`mt-3 flex items-start gap-1.5 text-sm ${mensaje.tipo === 'error' ? 'text-red-600' : 'text-emerald-700'}`}
        >
          <Icono nombre={mensaje.tipo === 'error' ? 'alerta' : 'check'} className="mt-0.5 h-4 w-4 shrink-0" />
          {mensaje.texto}
        </p>
      )}
    </section>
  );
}
