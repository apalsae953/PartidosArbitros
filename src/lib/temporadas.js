import { ESTADOS } from './constantes.js';
import { fechaDeHoy, ordenarPorFecha } from './formato.js';

// Las temporadas van de julio a junio: la 2026/27 empieza el 1 de julio de 2026.
// Cada temporada se identifica por su año de inicio ("2026").
const MES_INICIO_TEMPORADA = 7;
export const TODAS_LAS_TEMPORADAS = 'todas';

const formatoMesLargo = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const formatoMesCorto = new Intl.DateTimeFormat('es-ES', { month: 'short' });

export function temporadaDe(fecha) {
  const [anio, mes] = fecha.split('-').map(Number);
  return String(mes >= MES_INICIO_TEMPORADA ? anio : anio - 1);
}

export function nombreTemporada(id) {
  const inicio = Number(id);
  return `${inicio}/${String(inicio + 1).slice(-2)}`;
}

// Los 12 meses de una temporada en formato AAAA-MM, de julio a junio
export function mesesDeTemporada(id) {
  const inicio = Number(id);
  return Array.from({ length: 12 }, (_, i) => {
    const mes = ((MES_INICIO_TEMPORADA - 1 + i) % 12) + 1;
    const anio = mes >= MES_INICIO_TEMPORADA ? inicio : inicio + 1;
    return `${anio}-${String(mes).padStart(2, '0')}`;
  });
}

// Temporadas con partidos más la actual (y la seleccionada), de la más reciente a la más antigua
export function temporadasDisponibles(partidos, seleccionada, hoy = fechaDeHoy()) {
  const ids = new Set(partidos.map((p) => temporadaDe(p.fecha)));
  ids.add(temporadaDe(hoy));
  if (seleccionada && seleccionada !== TODAS_LAS_TEMPORADAS) ids.add(seleccionada);
  return [...ids].sort((a, b) => Number(b) - Number(a));
}

// Al abrir la app se muestra la temporada actual, salvo que no tenga partidos y sí haya de otras
export function temporadaInicial(partidos, hoy = fechaDeHoy()) {
  const actual = temporadaDe(hoy);
  if (partidos.length === 0 || partidos.some((p) => temporadaDe(p.fecha) === actual)) return actual;
  return temporadasDisponibles(partidos, null, hoy).find((id) => partidos.some((p) => temporadaDe(p.fecha) === id));
}

export function mesDe(fecha) {
  return fecha.slice(0, 7);
}

function aFechaDeMes(mes) {
  const [anio, numero] = mes.split('-').map(Number);
  return new Date(anio, numero - 1, 1);
}

// "2026-10" -> "Octubre de 2026"
export function nombreMes(mes) {
  const texto = formatoMesLargo.format(aFechaDeMes(mes));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10" -> "oct"
export function nombreMesCorto(mes) {
  return formatoMesCorto.format(aFechaDeMes(mes)).replace('.', '');
}

// Minúsculas y sin tildes, para que buscar "montana" encuentre "Montaña"
export function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function filtrarPartidos(partidos, { temporada, mes, estado, busqueda }) {
  const termino = normalizarTexto(busqueda || '');
  return partidos.filter(
    (p) =>
      (!temporada || temporada === TODAS_LAS_TEMPORADAS || temporadaDe(p.fecha) === temporada) &&
      (!mes || mesDe(p.fecha) === mes) &&
      (!estado || estado === 'todos' || p.estado === estado) &&
      (!termino || normalizarTexto(`${p.local} ${p.visitante} ${p.categoria}`).includes(termino))
  );
}

// Agrupa por mes (del más reciente al más antiguo) con el total de cada grupo
export function agruparPorMes(partidos) {
  const grupos = [];
  for (const partido of ordenarPorFecha(partidos)) {
    const mes = mesDe(partido.fecha);
    let grupo = grupos[grupos.length - 1];
    if (!grupo || grupo.mes !== mes) {
      grupo = { mes, partidos: [], total: 0 };
      grupos.push(grupo);
    }
    grupo.partidos.push(partido);
    grupo.total += partido.importeCentimos;
  }
  return grupos;
}

// Cobrado y pendiente de cada mes de la temporada, para el gráfico
export function resumenMensual(partidos, temporada) {
  const meses = mesesDeTemporada(temporada).map((mes) => ({ mes, cobrado: 0, pendiente: 0, partidos: 0 }));
  const porMes = new Map(meses.map((m) => [m.mes, m]));
  for (const partido of partidos) {
    const datos = porMes.get(mesDe(partido.fecha));
    if (!datos) continue;
    datos.partidos += 1;
    if (partido.estado === ESTADOS.COBRADO) datos.cobrado += partido.importeCentimos;
    else datos.pendiente += partido.importeCentimos;
  }
  return meses;
}

// Importe del último partido registrado en esa categoría, para proponerlo al añadir otro
export function importeSugerido(partidos, categoria) {
  const buscada = normalizarTexto(categoria || '');
  if (!buscada) return null;
  let ultimo = null;
  for (const partido of partidos) {
    if (normalizarTexto(partido.categoria) === buscada && (!ultimo || partido.creadoEn > ultimo.creadoEn)) {
      ultimo = partido;
    }
  }
  return ultimo ? ultimo.importeCentimos : null;
}

// Categorías más usadas, para ofrecerlas como accesos rápidos en el formulario
export function categoriasFrecuentes(partidos, cantidad = 5) {
  const conteo = new Map();
  for (const { categoria } of partidos) {
    const clave = normalizarTexto(categoria);
    const actual = conteo.get(clave) || { nombre: categoria, veces: 0 };
    actual.veces += 1;
    conteo.set(clave, actual);
  }
  return [...conteo.values()]
    .sort((a, b) => b.veces - a.veces || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, cantidad)
    .map((c) => c.nombre);
}
