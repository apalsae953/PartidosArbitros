import { useRef, useState } from 'react';
import Icono from './Icono.jsx';
import { CATEGORIAS, ESTADOS, ETIQUETAS_ESTADO } from '../lib/constantes.js';
import { centimosATexto, fechaDeHoy, textoACentimos } from '../lib/formato.js';

// Longitud máxima de los textos, para evitar registros enormes por error
const MAX_TEXTO = 80;

function valoresIniciales(partido, base) {
  if (partido) {
    return {
      fecha: partido.fecha,
      local: partido.local,
      visitante: partido.visitante,
      categoria: partido.categoria,
      importe: centimosATexto(partido.importeCentimos),
      estado: partido.estado,
    };
  }
  return {
    fecha: base?.fecha || fechaDeHoy(),
    local: '',
    visitante: '',
    categoria: base?.categoria || '',
    importe: base?.importe || '',
    estado: base?.estado || ESTADOS.PENDIENTE,
  };
}

function clasesEntrada(conError) {
  const base =
    'block w-full rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:outline-none focus:ring-4 sm:text-sm';
  return conError
    ? `${base} border-red-300 focus:border-red-500 focus:ring-red-500/15`
    : `${base} border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/15`;
}

function Campo({ id, etiqueta, error, ayuda, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <Icono nombre="alerta" className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1.5 text-xs text-slate-500">{ayuda}</p>
      )}
    </div>
  );
}

// Valida el formulario y devuelve los errores por campo (vacío si todo es correcto)
export function validarFormulario(valores) {
  const errores = {};
  const importeCentimos = textoACentimos(valores.importe);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.fecha)) errores.fecha = 'Indica la fecha';
  if (!valores.local.trim()) errores.local = 'Indica el equipo local';
  if (!valores.visitante.trim()) errores.visitante = 'Indica el equipo visitante';
  if (!valores.categoria.trim()) errores.categoria = 'Indica la categoría';
  if (importeCentimos === null || importeCentimos <= 0) errores.importe = 'Importe no válido';
  else if (importeCentimos > 10000000) errores.importe = 'Importe demasiado alto';
  return { errores, importeCentimos };
}

const clasesBoton =
  'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-[background-color,transform] duration-150 ease-salida focus:outline-none active:scale-[0.97]';

// Formulario para añadir un partido nuevo (sin "partido") o editar uno existente
export default function FormularioPartido({
  partido,
  base,
  categoriasRapidas,
  sugerirImporte,
  onGuardar,
  onEliminar,
}) {
  const editando = Boolean(partido);
  const [valores, setValores] = useState(() => valoresIniciales(partido, base));
  const [errores, setErrores] = useState({});
  // Indica si el importe lo ha propuesto la app (y por tanto se puede sustituir al cambiar de categoría)
  const [importeSugerido, setImporteSugerido] = useState(false);
  // Marca que se ha pulsado "Guardar y añadir otro" (Enter siempre equivale a "Guardar partido")
  const refOtro = useRef(false);

  function actualizar(cambios) {
    setValores((actuales) => ({ ...actuales, ...cambios }));
    // Al corregir un campo se oculta su mensaje de error
    const campos = Object.keys(cambios).filter((campo) => errores[campo]);
    if (campos.length) setErrores((actuales) => ({ ...actuales, ...Object.fromEntries(campos.map((c) => [c, undefined])) }));
  }

  // Al elegir categoría se propone el importe del último partido de esa categoría
  function cambiarCategoria(categoria) {
    const cambios = { categoria };
    if (!editando && (valores.importe === '' || importeSugerido)) {
      const sugerido = sugerirImporte(categoria);
      if (sugerido !== null) {
        cambios.importe = centimosATexto(sugerido);
        setImporteSugerido(true);
      } else if (importeSugerido) {
        cambios.importe = '';
        setImporteSugerido(false);
      }
    }
    actualizar(cambios);
  }

  function enviar(evento) {
    evento.preventDefault();
    const otro = refOtro.current;
    refOtro.current = false;

    const { errores: nuevosErrores, importeCentimos } = validarFormulario(valores);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      document.getElementById(Object.keys(nuevosErrores)[0])?.focus();
      return;
    }

    onGuardar(
      {
        fecha: valores.fecha,
        local: valores.local.trim(),
        visitante: valores.visitante.trim(),
        categoria: valores.categoria.trim(),
        importeCentimos,
        estado: valores.estado,
      },
      { otro }
    );
  }

  function propsError(campo) {
    return {
      'aria-invalid': Boolean(errores[campo]),
      'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
    };
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo id="fecha" etiqueta="Fecha" error={errores.fecha}>
        <input
          id="fecha"
          type="date"
          value={valores.fecha}
          onChange={(e) => actualizar({ fecha: e.target.value })}
          className={clasesEntrada(errores.fecha)}
          {...propsError('fecha')}
        />
      </Campo>

      {/* Equipos con botón para intercambiarlos si se han puesto al revés */}
      <div className="relative space-y-4">
        <Campo id="local" etiqueta="Equipo local" error={errores.local}>
          <input
            id="local"
            data-autofoco={editando ? undefined : ''}
            type="text"
            autoComplete="off"
            autoCapitalize="words"
            maxLength={MAX_TEXTO}
            placeholder="Ej. CD Ribera"
            value={valores.local}
            onChange={(e) => actualizar({ local: e.target.value })}
            className={clasesEntrada(errores.local)}
            {...propsError('local')}
          />
        </Campo>
        <Campo id="visitante" etiqueta="Equipo visitante" error={errores.visitante}>
          <input
            id="visitante"
            type="text"
            autoComplete="off"
            autoCapitalize="words"
            maxLength={MAX_TEXTO}
            placeholder="Ej. UD Montaña"
            value={valores.visitante}
            onChange={(e) => actualizar({ visitante: e.target.value })}
            className={clasesEntrada(errores.visitante)}
            {...propsError('visitante')}
          />
        </Campo>
        <button
          type="button"
          onClick={() => actualizar({ local: valores.visitante, visitante: valores.local })}
          aria-label="Intercambiar equipo local y visitante"
          title="Intercambiar equipos"
          className="absolute right-2 top-[4.75rem] -translate-y-1/2 rounded-full bg-white p-1.5 text-slate-400 ring-1 ring-slate-200 transition-[color,transform] duration-150 ease-salida hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-90"
        >
          <Icono nombre="intercambiar" className="h-3.5 w-3.5 rotate-90" />
        </button>
      </div>

      <Campo id="categoria" etiqueta="Categoría" error={errores.categoria}>
        <input
          id="categoria"
          type="text"
          list="lista-categorias"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={MAX_TEXTO}
          placeholder="Ej. Juvenil"
          value={valores.categoria}
          onChange={(e) => cambiarCategoria(e.target.value)}
          className={clasesEntrada(errores.categoria)}
          {...propsError('categoria')}
        />
        <datalist id="lista-categorias">
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria} />
          ))}
        </datalist>
        {categoriasRapidas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Categorías habituales">
            {categoriasRapidas.map((categoria) => {
              const activa = valores.categoria.trim().toLowerCase() === categoria.toLowerCase();
              return (
                <button
                  key={categoria}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => cambiarCategoria(categoria)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    activa
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/30'
                      : 'text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {categoria}
                </button>
              );
            })}
          </div>
        )}
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo
          id="importe"
          etiqueta="Importe"
          error={errores.importe}
          ayuda={importeSugerido ? 'Como tu último partido de esta categoría' : undefined}
        >
          <div className="relative">
            <input
              id="importe"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              maxLength={12}
              placeholder="0,00"
              value={valores.importe}
              onChange={(e) => {
                setImporteSugerido(false);
                actualizar({ importe: e.target.value });
              }}
              className={`${clasesEntrada(errores.importe)} cifras pr-8`}
              {...propsError('importe')}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">€</span>
          </div>
        </Campo>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-slate-700">Cobro</legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            {[ESTADOS.PENDIENTE, ESTADOS.COBRADO].map((estado) => {
              const seleccionado = valores.estado === estado;
              const colorSeleccion = estado === ESTADOS.COBRADO ? 'text-emerald-700' : 'text-amber-700';
              return (
                <label
                  key={estado}
                  title={ETIQUETAS_ESTADO[estado]}
                  className={`flex h-[2.125rem] cursor-pointer items-center justify-center rounded-md text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 sm:text-sm ${
                    seleccionado ? `bg-white shadow-sm ${colorSeleccion}` : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="estado"
                    value={estado}
                    checked={seleccionado}
                    onChange={() => actualizar({ estado })}
                    className="sr-only"
                  />
                  {ETIQUETAS_ESTADO[estado]}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Para cancelar están la X de arriba, la tecla Escape y tocar fuera de la ventana */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        {editando ? (
          <button
            type="button"
            onClick={() => onEliminar(partido.id)}
            className={`${clasesBoton} text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400`}
          >
            <Icono nombre="papelera" className="h-4 w-4" />
            Eliminar
          </button>
        ) : (
          <button
            type="button"
            title="Guarda este partido y deja el formulario listo para el siguiente"
            onClick={(evento) => {
              refOtro.current = true;
              evento.currentTarget.form.requestSubmit();
            }}
            className={`${clasesBoton} text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400`}
          >
            <Icono nombre="mas" className="h-4 w-4" />
            Guardar y otro
          </button>
        )}
        <button
          type="submit"
          className={`${clasesBoton} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-500/30`}
        >
          <Icono nombre="check" className="h-4 w-4" />
          Guardar
        </button>
      </div>
    </form>
  );
}
