import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AvisoActualizacion from './components/AvisoActualizacion.jsx';
import AvisoDatos from './components/AvisoDatos.jsx';
import Cabecera from './components/Cabecera.jsx';
import CopiaSeguridad from './components/CopiaSeguridad.jsx';
import DialogoCuenta from './components/DialogoCuenta.jsx';
import DialogoImportarPdf from './components/DialogoImportarPdf.jsx';
import DialogoPartido from './components/DialogoPartido.jsx';
import GraficoMensual from './components/GraficoMensual.jsx';
import Icono from './components/Icono.jsx';
import ListaPartidos from './components/ListaPartidos.jsx';
import MigrarPartidos from './components/MigrarPartidos.jsx';
import Notificacion from './components/Notificacion.jsx';
import PanelEstadisticas from './components/PanelEstadisticas.jsx';
import PieLegal from './components/PieLegal.jsx';
import RecordatorioCopia, { diasSinCopia } from './components/RecordatorioCopia.jsx';
import { usarInstalacion } from './hooks/usarInstalacion.js';
import { usarPartidos } from './hooks/usarPartidos.js';
import { usarSesion } from './hooks/usarSesion.js';
import {
  avisoYaCerrado,
  cargarPartidos,
  guardarPartidos,
  leerUltimaCopia,
  limpiarOpcionales,
  recordarAvisoCerrado,
  registrarCopia,
} from './lib/almacenamiento.js';
import { ESTADOS } from './lib/constantes.js';
import { combinarPartidos, exportarJSON } from './lib/copiaSeguridad.js';
import { esIOS as detectarIOS } from './lib/dispositivo.js';
import { centimosATexto, generarId, ordenarPorFecha, textoPartidos } from './lib/formato.js';
import { analizarPdfs, buscarDuplicado, esPdf } from './lib/importarPdf.js';
import { leerPaginasPdf } from './lib/leerPdf.js';
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
  const [aviso, setAviso] = useState(null);
  const mostrarAviso = useCallback((datos) => setAviso({ id: generarId(), ...datos }), []);
  const cerrarNotificacion = useCallback(() => setAviso(null), []);

  // Cuenta y partidos: sin sesión se guardan en el dispositivo; con sesión, en la nube
  const sesion = usarSesion();
  const { partidos, cambiarPartidos, errorGuardado, nube, enNube } = usarPartidos(
    sesion,
    useCallback((mensaje) => mensaje && mostrarAviso({ texto: mensaje, icono: 'alerta' }), [mostrarAviso])
  );
  const [cuenta, setCuenta] = useState({ abierto: false, apertura: 0 });
  // Partidos que había en el dispositivo antes de entrar en la cuenta, pendientes de subir
  const [locales, setLocales] = useState([]);

  const [temporada, setTemporada] = useState(() => temporadaInicial(partidos));
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [dialogo, setDialogo] = useState({ abierto: false, partido: null, base: null, apertura: 0 });
  const [importacion, setImportacion] = useState({
    abierto: false,
    apertura: 0,
    cargando: false,
    resultados: [],
    numArchivos: 0,
  });
  const [arrastrando, setArrastrando] = useState(false);
  const refSelectorPdf = useRef(null);
  const [resaltadoId, setResaltadoId] = useState(null);
  const [avisoVisible, setAvisoVisible] = useState(() => !avisoYaCerrado());
  const [ultimaCopia, setUltimaCopia] = useState(leerUltimaCopia);
  const { puedeInstalar, instalada, instalar } = usarInstalacion();

  // Al terminar de cargar los partidos de la nube se elige la temporada adecuada para ellos
  const nubeCargada = enNube && !nube.cargando;
  const refTemporadaElegida = useRef(false);
  useEffect(() => {
    if (!nubeCargada || refTemporadaElegida.current) return;
    refTemporadaElegida.current = true;
    setTemporada(temporadaInicial(partidos));
    setFiltros(FILTROS_INICIALES);
    // Al entrar, se ofrece subir los partidos que había solo en este dispositivo
    setLocales(cargarPartidos());
  }, [nubeCargada, partidos]);

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

  // Arrastrar y soltar PDF en cualquier parte de la página (en ordenador)
  useEffect(() => {
    let profundidad = 0;
    const llevaArchivos = (evento) => evento.dataTransfer?.types.includes('Files');
    function alEntrar(evento) {
      if (!llevaArchivos(evento)) return;
      profundidad += 1;
      setArrastrando(true);
    }
    function alSalir(evento) {
      if (!llevaArchivos(evento)) return;
      profundidad = Math.max(profundidad - 1, 0);
      if (profundidad === 0) setArrastrando(false);
    }
    function alPasar(evento) {
      if (llevaArchivos(evento)) evento.preventDefault();
    }
    function alSoltar(evento) {
      if (!llevaArchivos(evento)) return;
      evento.preventDefault();
      profundidad = 0;
      setArrastrando(false);
      const pdfs = [...evento.dataTransfer.files].filter(esPdf);
      if (pdfs.length > 0) procesarPdfsRef.current(pdfs);
    }
    window.addEventListener('dragenter', alEntrar);
    window.addEventListener('dragleave', alSalir);
    window.addEventListener('dragover', alPasar);
    window.addEventListener('drop', alSoltar);
    return () => {
      window.removeEventListener('dragenter', alEntrar);
      window.removeEventListener('dragleave', alSalir);
      window.removeEventListener('dragover', alPasar);
      window.removeEventListener('drop', alSoltar);
    };
  }, []);

  const partidosTemporada = useMemo(() => filtrarPartidos(partidos, { temporada }), [partidos, temporada]);
  const partidosVisibles = useMemo(() => filtrarPartidos(partidosTemporada, filtros), [partidosTemporada, filtros]);
  const temporadas = useMemo(() => temporadasDisponibles(partidos, temporada), [partidos, temporada]);
  const categoriasRapidas = useMemo(() => {
    const frecuentes = categoriasFrecuentes(partidos);
    return frecuentes.length > 0 ? frecuentes : CATEGORIAS_POR_DEFECTO;
  }, [partidos]);
  const sugerirImporte = useCallback((categoria) => importeSugerido(partidos, categoria), [partidos]);

  // =========================================================================
  // Cuenta
  // =========================================================================

  function abrirCuenta() {
    setCuenta((actual) => ({ abierto: true, apertura: actual.apertura + 1 }));
  }

  const cerrarCuenta = useCallback(() => setCuenta((actual) => ({ ...actual, abierto: false })), []);

  // Al iniciar sesión se cierra la ventana de acceso
  const refEstadoSesion = useRef(sesion.estado);
  useEffect(() => {
    if (refEstadoSesion.current === 'invitado' && sesion.estado === 'conectado') {
      cerrarCuenta();
      mostrarAviso({ texto: `Sesión iniciada como ${sesion.usuario.email}`, icono: 'nube' });
    }
    refEstadoSesion.current = sesion.estado;
  }, [sesion.estado, sesion.usuario, cerrarCuenta, mostrarAviso]);

  // Sube a la cuenta los partidos del dispositivo que aún no estén en ella y los quita del dispositivo
  function subirPartidosLocales() {
    const nuevos = locales.filter((partido) => !buscarDuplicado(partido, partidos));
    cambiarPartidos((actuales) => combinarPartidos(actuales, nuevos, 'combinar'));
    // Firestore guarda los cambios en el dispositivo hasta que se suben, así que ya se pueden quitar de aquí
    guardarPartidos([]);
    setLocales([]);
    setTemporada(temporadaInicial([...partidos, ...nuevos]));
    mostrarAviso({
      texto: nuevos.length === 0 ? 'Esos partidos ya estaban en tu cuenta' : `${textoPartidos(nuevos.length)} subidos a tu cuenta`,
      icono: 'nube',
    });
  }

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
      cambiarPartidos((actuales) => actuales.map((p) => (p.id === guardado.id ? guardado : p)));
      mostrarAviso({ texto: 'Cambios guardados' });
    } else {
      guardado = { id: generarId(), creadoEn: Date.now(), ...datos };
      cambiarPartidos((actuales) => [...actuales, guardado]);
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

  // =========================================================================
  // Importación desde PDF de designación
  // =========================================================================

  // Se abre el selector dentro del propio clic (los navegadores lo exigen)
  function elegirPdf() {
    refSelectorPdf.current.click();
  }

  async function procesarPdfs(archivos) {
    const lista = [...archivos];
    if (lista.length === 0) return;
    cerrarDialogo();
    const apertura = importacion.apertura + 1;
    setImportacion({ abierto: true, apertura, cargando: true, resultados: [], numArchivos: lista.length });
    const resultados = await analizarPdfs(lista, partidos, leerPaginasPdf);
    // Si mientras tanto se cerró o se empezó otra importación, se descarta este resultado
    setImportacion((actual) =>
      actual.apertura === apertura && actual.abierto ? { ...actual, cargando: false, resultados } : actual
    );
  }

  // El arrastre usa la versión más reciente de la función sin volver a registrar los eventos
  const procesarPdfsRef = useRef(procesarPdfs);
  procesarPdfsRef.current = procesarPdfs;

  function anadirImportados(nuevos, estado) {
    const ahora = Date.now();
    const creados = nuevos.map((partido, i) =>
      limpiarOpcionales({ id: generarId(), creadoEn: ahora + i, ...partido, estado })
    );
    cambiarPartidos((actuales) => [...actuales, ...creados]);
    setImportacion((actual) => ({ ...actual, abierto: false }));
    const masReciente = ordenarPorFecha(creados)[0];
    asegurarVisible(masReciente);
    setResaltadoId(masReciente.id);
    mostrarAviso({
      texto: creados.length === 1 ? 'Partido añadido desde el PDF' : `${textoPartidos(creados.length)} añadidos desde PDF`,
      icono: 'documento',
    });
  }

  function alternarEstado(id) {
    cambiarPartidos((actuales) =>
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
    cambiarPartidos((actuales) => actuales.filter((p) => p.id !== id));
    cerrarDialogo();
    mostrarAviso({
      texto: 'Partido eliminado',
      icono: 'papelera',
      accion: {
        etiqueta: 'Deshacer',
        alHacer: () => {
          cambiarPartidos((actuales) => (actuales.some((p) => p.id === id) ? actuales : [...actuales, eliminado]));
          setResaltadoId(id);
        },
      },
    });
  }

  function importarPartidos(importados, modo) {
    const resultado = combinarPartidos(partidos, importados, modo);
    cambiarPartidos(resultado);
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
  // Con cuenta los datos ya están a salvo en la nube, así que no hace falta recordar las copias
  const diasRecordatorio = enNube ? null : diasSinCopia(ultimaCopia, partidos.length);
  // Mientras se recupera la sesión o se cargan los partidos de la nube, la lista muestra que está cargando
  const cargandoDatos = sesion.estado === 'comprobando' || (enNube && nube.cargando);
  const datosCuenta = {
    estado: sesion.estado,
    email: sesion.usuario?.email || '',
    inicial: (sesion.usuario?.nombre || sesion.usuario?.email || '?').charAt(0).toUpperCase(),
    sincronizado: !nube.pendientes,
  };

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
        onImportarPdf={elegirPdf}
        cuenta={datosCuenta}
        onCuenta={abrirCuenta}
      />

      <main className="relative mx-auto -mt-20 max-w-6xl space-y-4 px-4 pb-28 sm:-mt-24 sm:space-y-6 sm:px-6 sm:pb-10">
        {errorGuardado && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
            No se han podido guardar los cambios en este navegador (puede que esté en modo privado o sin espacio).
            Exporta una copia de seguridad para no perderlos.
          </p>
        )}

        {enNube && nubeCargada && locales.length > 0 && (
          <MigrarPartidos cantidad={locales.length} onSubir={subirPartidosLocales} onDescartar={() => setLocales([])} />
        )}

        {/* Sin cuenta, los datos dependen del navegador: se avisa del riesgo */}
        {avisoVisible && !enNube && sesion.estado !== 'comprobando' && (
          <AvisoDatos
            hayDatos={partidos.length > 0}
            instalada={instalada}
            puedeInstalar={puedeInstalar}
            esIOS={ES_IOS}
            onInstalar={instalar}
            onExportar={exportarCopia}
            onCrearCuenta={sesion.estado === 'invitado' ? abrirCuenta : undefined}
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
              cargando={cargandoDatos}
              filtros={filtros}
              onCambiarFiltros={cambiarFiltros}
              onQuitarFiltros={() => setFiltros(FILTROS_INICIALES)}
              resaltadoId={resaltadoId}
              onEditar={abrirEdicion}
              onAlternarEstado={alternarEstado}
              onNuevo={() => abrirNuevo()}
              onImportarPdf={elegirPdf}
            />
          </div>

          <div className={`lg:col-start-2 ${conGrafico ? 'lg:row-start-2' : 'lg:row-start-1'}`}>
            <CopiaSeguridad
              partidos={partidos}
              ultimaCopia={ultimaCopia}
              onExportarJSON={exportarCopia}
              onImportar={importarPartidos}
              onVerAviso={verAvisoDatos}
              cuenta={sesion.estado === 'sin-cuentas' ? null : { enNube, email: datosCuenta.email, nube }}
              onCuenta={abrirCuenta}
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
        onImportarPdf={elegirPdf}
        onCerrar={cerrarDialogo}
      />

      {sesion.estado !== 'sin-cuentas' && (
        <DialogoCuenta
          abierto={cuenta.abierto}
          apertura={cuenta.apertura}
          sesion={sesion}
          nube={nube}
          numPartidos={partidos.length}
          onExportar={exportarCopia}
          onCerrar={cerrarCuenta}
        />
      )}

      <DialogoImportarPdf
        importacion={importacion}
        onConfirmar={anadirImportados}
        onCerrar={() => setImportacion((actual) => ({ ...actual, abierto: false }))}
      />

      {/* Selector de archivos compartido por todos los botones de "Importar PDF" */}
      <input
        ref={refSelectorPdf}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(evento) => {
          const archivos = [...evento.target.files];
          // Se vacía para poder volver a elegir los mismos archivos
          evento.target.value = '';
          procesarPdfs(archivos);
        }}
      />

      {arrastrando && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-emerald-400 bg-white px-10 py-8 text-center shadow-2xl">
            <Icono nombre="documento" className="h-10 w-10 text-emerald-600" />
            <p className="mt-3 text-base font-semibold text-slate-900">Suelta aquí tus PDF de designación</p>
            <p className="mt-1 text-sm text-slate-500">Se leen en tu dispositivo y podrás revisarlos antes de añadirlos.</p>
          </div>
        </div>
      )}

      <Notificacion aviso={aviso} onCerrar={cerrarNotificacion} />
    </>
  );
}
