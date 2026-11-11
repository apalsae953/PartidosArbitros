import Icono from './Icono.jsx';

// Aviso sobre dónde se guardan los datos. En iPhone añade la advertencia de los 7 días de Safari.
export default function AvisoDatos({
  hayDatos,
  instalada,
  puedeInstalar,
  esIOS,
  onInstalar,
  onExportar,
  onCrearCuenta,
  onCerrar,
}) {
  const riesgoSafari = esIOS && !instalada;

  return (
    <section aria-labelledby="aviso-datos-titulo" className="rounded-2xl bg-amber-50 p-4 shadow-sm ring-1 ring-amber-200 sm:p-5">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Icono nombre="triangulo" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 id="aviso-datos-titulo" className="pt-1.5 font-semibold text-amber-900">
              Atención
            </h2>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar aviso"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-700 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Icono nombre="cerrar" className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-amber-900/90">
            Los datos de tus partidos se guardan en la memoria de este navegador. Si borras el historial, el caché o las
            cookies de tu navegador, <strong className="font-semibold">perderás toda la información</strong>. Se recomienda
            instalar la app o no borrar los datos del sitio.
          </p>

          {riesgoSafari && (
            <div className="mt-3 rounded-lg bg-white/70 p-3 ring-1 ring-inset ring-amber-300">
              <p className="text-sm font-semibold text-amber-900">Importante en iPhone y iPad</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
                Safari borra los datos de las webs que no abres durante 7 días. Para que no te pase,{' '}
                <strong className="font-semibold">añade la app a la pantalla de inicio</strong>: pulsa{' '}
                <span className="inline-flex items-center gap-0.5 font-medium">
                  Compartir <Icono nombre="compartir" className="h-3.5 w-3.5" />
                </span>{' '}
                y luego «Añadir a pantalla de inicio». Después, ábrela siempre desde ese icono.
              </p>
            </div>
          )}

          {!instalada && !esIOS && (
            <p className="mt-2 text-xs leading-relaxed text-amber-900/70">
              Para instalarla en Android: menú del navegador &gt; «Instalar aplicación» o «Añadir a pantalla de inicio».
            </p>
          )}

          {onCrearCuenta && (
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
              <strong className="font-semibold">La forma más segura es crear una cuenta gratis</strong>: tus partidos se
              guardan en la nube y los ves en el móvil y en el ordenador.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {onCrearCuenta && (
              <button
                type="button"
                onClick={onCrearCuenta}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-salida hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:scale-[0.97]"
              >
                <Icono nombre="nube" className="h-4 w-4" />
                Crear cuenta
              </button>
            )}
            {puedeInstalar && (
              <button
                type="button"
                onClick={onInstalar}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/30"
              >
                <Icono nombre="movil" className="h-4 w-4" />
                Instalar app
              </button>
            )}
            <button
              type="button"
              onClick={onExportar}
              disabled={!hayDatos}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-300 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icono nombre="descargar" className="h-4 w-4" />
              Exportar mis datos
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="h-9 rounded-lg px-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
