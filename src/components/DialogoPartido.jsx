import FormularioPartido from './FormularioPartido.jsx';
import Icono from './Icono.jsx';
import VentanaModal from './VentanaModal.jsx';

// Datos que solo tienen los partidos importados de un PDF de designación (no se editan a mano)
function DatosDesignacion({ partido }) {
  if (!partido.designacion && !partido.hora && !partido.campo) return null;
  return (
    <div className="mb-5 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
      {partido.designacion && (
        <p className="flex items-center gap-1.5">
          <Icono nombre="documento" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          Designación nº {partido.designacion}
          {partido.hora && <> · {partido.hora} h</>}
        </p>
      )}
      {partido.campo && (
        <p className="flex items-start gap-1.5">
          <Icono nombre="ubicacion" className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />
          {partido.campo}
        </p>
      )}
    </div>
  );
}

// Ventana para crear o editar un partido
export default function DialogoPartido({
  dialogo,
  categoriasRapidas,
  sugerirImporte,
  onGuardar,
  onEliminar,
  onImportarPdf,
  onCerrar,
}) {
  const { abierto, partido, base, apertura } = dialogo;

  return (
    <VentanaModal abierto={abierto} apertura={apertura} titulo={partido ? 'Editar partido' : 'Nuevo partido'} onCerrar={onCerrar}>
      {partido ? (
        <DatosDesignacion partido={partido} />
      ) : (
        <button
          type="button"
          onClick={onImportarPdf}
          className="mb-5 flex w-full items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-3 text-left transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-600/10">
            <Icono nombre="documento" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-emerald-800">Rellenar desde el PDF de designación</span>
            <span className="block text-xs text-emerald-700/80">Se lee en tu dispositivo, no se envía a ningún sitio</span>
          </span>
          <Icono nombre="chevronDerecha" className="h-4 w-4 shrink-0 text-emerald-600" />
        </button>
      )}

      {/* La clave hace que el formulario empiece limpio cada vez que se abre */}
      <FormularioPartido
        key={apertura}
        partido={partido}
        base={base}
        categoriasRapidas={categoriasRapidas}
        sugerirImporte={sugerirImporte}
        onGuardar={onGuardar}
        onEliminar={onEliminar}
      />
    </VentanaModal>
  );
}
