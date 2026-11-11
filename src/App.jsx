import { useCallback, useEffect, useMemo, useState } from 'react';
import AvisoActualizacion from './components/AvisoActualizacion.jsx';
import AvisoDatos from './components/AvisoDatos.jsx';
import Cabecera from './components/Cabecera.jsx';
import CopiaSeguridad from './components/CopiaSeguridad.jsx';
import DialogoPartido from './components/DialogoPartido.jsx';
import GraficoMensual from './components/GraficoMensual.jsx';
import Icono from './components/Icono.jsx';
import ListaPartidos from './components/ListaPartidos.jsx';
import Notificacion from './components/Notificacion.jsx';
import PanelEstadisticas from './components/PanelEstadisticas.jsx';
import PieLegal from './components/PieLegal.jsx';
import RecordatorioCopia, { diasSinCopia } from './components/RecordatorioCopia.jsx';
import { usarInstalacion } from './hooks/usarInstalacion.js';
import {
  avisoYaCerrado,
  cargarPartidos,
  guardarPartidos,
  leerUltimaCopia,
  recordarAvisoCerrado,
  registrarCopia,
} from './lib/almacenamiento.js';
import { CLAVE_PARTIDOS, ESTADOS } from './lib/constantes.js';
import { combinarPartidos, exportarJSON } from './lib/copiaSeguridad.js';
import { esIOS as detectarIOS } from './lib/dispositivo.js';
import { centimosATexto, generarId } from './lib/formato.js';
import {
  TODAS_LAS_TEMPORADAS,
  categoriasFrecuentes,
  filtrarPartidos,
  importeSugerido,
  nombreTemporada,
  temporadaDe,
  temporadaInicial,
  temporadasDisponibles,
} from './lib/temporadas.js';

const ES_IOS = detectarIOS();
const FILTROS_INICIALES = { mes: null, estado: 'todos', busqueda: '' };
// Accesos rápidos de categoría mientras el usuario aún no tiene partidos propios
const CATEGORIAS_POR_DEFECTO = ['Alevín', 'Infantil', 'Cadete', 'Juvenil', 'Senior'];

function prefiereMenosMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function App() {
  const [partidos, setPartidos] = useState(cargarPartidos);
  const [temporada, setTemporada] = useState(() => temporadaInicial(partidos));
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [dialogo, setDialogo] = useState({ abierto: false, partido: null, base: null, apertura: 0 });
  const [aviso, setAviso] = useState(null);
  const [resaltadoId, setResaltadoId] = useState(null);
  const [avisoVisible, setAvisoVisible] = useState(() => !avisoYaCerrado());
  const [ultimaCopia, setUltimaCopia] = useState(leerUltimaCopia);
  const [errorGuardado, setErrorGuardado] = useState(false);
  const { puedeInstalar, instalada, instalar } = usarInstalacion();

  // Cada cambio se persiste en localStorage; si falla (almacenamiento lleno o bloqueado) se avisa
  useEffect(() => {
    setErrorGuardado(!guardarPartidos(partidos));
  }, [partidos]);

  // Si la app está abierta en otra pestaña, se mantienen ambas sincronizadas
  useEffect(() => {
    function alCambiarAlmacenamiento(evento) {
      if (evento.key === null || evento.key === CLAVE_PARTIDOS) setPartidos(cargarPartidos());
    }
    window.addEventListener('storage', alCambiarAlmacenamiento);
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento);
  }, []);

  // Tras añadir, editar o recuperar un partido, se lleva a la vista y se resalta un momento
  useEffect(() => {
    if (!resaltadoId) return;
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-partido="${resaltadoId}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' });
    });
    const temporizador = setTimeout(() => setResaltadoId(null), 2000);
    return () => clearTimeout(temporizador);
  }, [resaltadoId]);

  const partidosTemporada = useMemo(() => filtrarPartidos(partidos, { temporada }), [partidos, temporada]);
  const partidosVisibles = useMemo(() => filtrarPartidos(partidosTemporada, filtros), [partidosTemporada, filtros]);
  const temporadas = useMemo(() => temporadasDisponibles(partidos, temporada), [partidos, temporada]);
  const categoriasRapidas = useMemo(() => {
    const frecuentes = categoriasFrecuentes(partidos);
    return frecuentes.length > 0 ? frecuentes : CATEGORIAS_POR_DEFECTO;
  }, [partidos]);
  const sugerirImporte = useCallback((categoria) => importeSugerido(partidos, categoria), [partidos]);

  const mostrarAviso = useCallback((datos) => setAviso({ id: generarId(), ...datos }), []);
  const cerrarNotificacion = useCallback(() => setAviso(null), []);

  function cambiarTemporada(id) {
    setTemporada(id);
    setFiltros((actuales) => ({ ...actuales, mes: null }));
  }

  function cambiarFiltros(cambios) {
    setFiltros((actuales) => ({ ...actuales, ...cambios }));
  }

  // Si un partido guardado no se vería con la temporada o los filtros actuales, se ajustan
  function asegurarVisible(partido) {
    if (temporada !== TODAS_LAS_TEMPORADAS && temporadaDe(partido.fecha) !== temporada) {
      setTemporada(temporadaDe(partido.fecha));
      setFiltros(FILTROS_INICIALES);
    } else if (filtrarPartidos([partido], filtros).length === 0) {
      setFiltros(FILTROS_INICIALES);
    }
  }

  function abrirNuevo(base = null) {
    setDialogo((actual) => ({ abierto: true, partido: null, base, apertura: actual.apertura + 1 }));
  }

  function abrirEdicion(partido) {
    setDialogo((actual) => ({ abierto: true, partido, base: null, apertura: actual.apertura + 1 }));
  }

  const cerrarDialogo = useCallback(() => setDialogo((actual) => ({ ...actual, abierto: false })), []);

  function guardarPartido(datos, { otro }) {
    let guardado;
    if (dialogo.partido) {
      guardado = { ...dialogo.partido, ...datos };
      setPartidos((actuales) => actuales.map((p) => (p.id === guardado.id ? guardado : p)));
      mostrarAviso({ texto: 'Cambios guardados' });
    } else {
      guardado = { id: generarId(), creadoEn: Date.now(), ...datos };
      setPartidos((actuales) => [...actuales, guardado]);
      mostrarAviso({ texto: 'Partido añadido' });
    }
    asegurarVisible(guardado);
    setResaltadoId(guardado.id);

    // "Guardar y añadir otro" mantiene fecha, categoría, importe y estado para el siguiente
    if (otro) {
      abrirNuevo({
        fecha: datos.fecha,
        categoria: datos.categoria,
        importe: centimosATexto(datos.importeCentimos),
        estado: datos.estado,
      });
    } else {
      cerrarDialogo();
    }
  }

  function alternarEstado(id) {
    setPartidos((actuales) =>
      actuales.map((partido) =>
        partido.id === id
          ? { ...partido, estado: partido.estado === ESTADOS.COBRADO ? ESTADOS.PENDIENTE : ESTADOS.COBRADO }
          : partido
      )
    );
  }

  // Se borra al momento y se ofrece deshacer, en lugar de pedir confirmación antes
  function eliminarPartido(id) {
    const eliminado = partidos.find((p) => p.id === id);
    if (!eliminado) return;
    setPartidos((actuales) => actuales.filter((p) => p.id !== id));
    cerrarDialogo();
    mostrarAviso({
      texto: 'Partido eliminado',
      icono: 'papelera',
      accion: {
        etiqueta: 'Deshacer',
        alHacer: () => {
          setPartidos((actuales) => (actuales.some((p) => p.id === id) ? actuales : [...actuales, eliminado]));
          setResaltadoId(id);
        },
      },
    });
  }

  function importarPartidos(importados, modo) {
    const resultado = combinarPartidos(partidos, importados, modo);
    setPartidos(resultado);
    setTemporada(temporadaInicial(resultado));
    setFiltros(FILTROS_INICIALES);
  }

  // Solo la copia .json cuenta como copia de seguridad, porque es la única que se puede restaurar
  function exportarCopia() {
    exportarJSON(partidos);
    const ahora = Date.now();
    registrarCopia(ahora);
    setUltimaCopia(ahora);
    mostrarAviso({ texto: 'Copia descargada. Guárdala en un lugar seguro.', icono: 'escudo' });
  }

  function verPendientes() {
    setFiltros({ ...FILTROS_INICIALES, estado: ESTADOS.PENDIENTE });
    document
      .getElementById('lista-partidos')
      ?.scrollIntoView({ block: 'start', behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' });
  }

  function cerrarAvisoDatos() {
    recordarAvisoCerrado();
    setAvisoVisible(false);
  }

  function verAvisoDatos() {
    setAvisoVisible(true);
    window.scrollTo({ top: 0, behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' });
  }

  const conGrafico = temporada !== TODAS_LAS_TEMPORADAS;
  const diasRecordatorio = diasSinCopia(ultimaCopia, partidos.length);

  return (
    <>
      <AvisoActualizacion />

      <Cabecera
        temporada={temporada}
        temporadas={temporadas}
        onCambiarTemporada={cambiarTemporada}
        puedeInstalar={puedeInstalar}
        onInstalar={instalar}
        onNuevo={() => abrirNuevo()}
      />

      <main className="relative mx-auto -mt-20 max-w-6xl space-y-4 px-4 pb-28 sm:-mt-24 sm:space-y-6 sm:px-6 sm:pb-10">
        {errorGuardado && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
            No se han podido guardar los cambios en este navegador (puede que esté en modo privado o sin espacio).
            Exporta una copia de seguridad para no perderlos.
          </p>
        )}

        {avisoVisible && (
          <AvisoDatos
            hayDatos={partidos.length > 0}
            instalada={instalada}
            puedeInstalar={puedeInstalar}
            esIOS={ES_IOS}
            onInstalar={instalar}
            onExportar={exportarCopia}
            onCerrar={cerrarAvisoDatos}
          />
        )}

        <PanelEstadisticas
          partidos={partidosTemporada}
          etiquetaPeriodo={conGrafico ? nombreTemporada(temporada) : 'Histórico'}
          onVerPendientes={verPendientes}
        />

        {diasRecordatorio !== null && <RecordatorioCopia dias={diasRecordatorio} onExportar={exportarCopia} />}

        {/* En escritorio: lista a la izquierda; gráfico y datos a la derecha. En móvil, apilados. */}
        <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr]">
          {conGrafico && (
            <div className="lg:col-start-2 lg:row-start-1">
              <GraficoMensual
                partidos={partidosTemporada}
                temporada={temporada}
                mesSeleccionado={filtros.mes}
                onSeleccionarMes={(mes) => cambiarFiltros({ mes })}
              />
            </div>
          )}

          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <ListaPartidos
              partidos={partidosVisibles}
              hayPartidos={partidos.length > 0}
              filtros={filtros}
              onCambiarFiltros={cambiarFiltros}
              onQuitarFiltros={() => setFiltros(FILTROS_INICIALES)}
              resaltadoId={resaltadoId}
              onEditar={abrirEdicion}
              onAlternarEstado={alternarEstado}
              onNuevo={() => abrirNuevo()}
            />
          </div>

          <div className={`lg:col-start-2 ${conGrafico ? 'lg:row-start-2' : 'lg:row-start-1'}`}>
            <CopiaSeguridad
              partidos={partidos}
              ultimaCopia={ultimaCopia}
              onExportarJSON={exportarCopia}
              onImportar={importarPartidos}
              onVerAviso={verAvisoDatos}
            />
          </div>
        </div>
      </main>

      <PieLegal />

      {/* Botón flotante para añadir en móvil (en pantallas grandes está en la cabecera) */}
      <button
        type="button"
        onClick={() => abrirNuevo()}
        aria-label="Nuevo partido"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-700/30 transition-transform duration-150 ease-salida focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:scale-95 sm:hidden"
      >
        <Icono nombre="mas" className="h-6 w-6" />
      </button>

      <DialogoPartido
        dialogo={dialogo}
        categoriasRapidas={categoriasRapidas}
        sugerirImporte={sugerirImporte}
        onGuardar={guardarPartido}
        onEliminar={eliminarPartido}
        onCerrar={cerrarDialogo}
      />

      <Notificacion aviso={aviso} onCerrar={cerrarNotificacion} />
    </>
  );
}
