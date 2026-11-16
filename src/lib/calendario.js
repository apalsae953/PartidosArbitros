import { fechaDeHoy, parsearFecha } from './formato.js';

// Un partido se considera "pendiente de pitar" hasta 2 horas después de su hora de inicio.
// Si no tiene hora, hasta que termina el día.
const DURACION_PARTIDO_MS = 2 * 60 * 60 * 1000;

const formatoDiaLargo = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const formatoMesAnio = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// Iniciales de los días, con la semana empezando en lunes (X para miércoles, como en los calendarios españoles)
export const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Momento en que termina el plazo para considerar el partido como próximo
function finPartido(partido) {
  const dia = parsearFecha(partido.fecha);
  if (!partido.hora) return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1).getTime();
  const [horas, minutos] = partido.hora.split(':').map(Number);
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas, minutos).getTime() + DURACION_PARTIDO_MS;
}

// Orden cronológico: por fecha y hora (los que no tienen hora, al final de su día)
export function ordenCronologico(a, b) {
  return a.fecha.localeCompare(b.fecha) || (a.hora || '99:99').localeCompare(b.hora || '99:99');
}

// Partidos que aún no se han pitado, del más cercano al más lejano
export function proximosPartidos(partidos, ahora = new Date()) {
  return partidos.filter((p) => finPartido(p) > ahora.getTime()).sort(ordenCronologico);
}

// Agrupa una lista ya ordenada por día: [{ fecha, partidos }]
export function agruparPorDia(partidos) {
  const grupos = [];
  for (const partido of partidos) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === partido.fecha) ultimo.partidos.push(partido);
    else grupos.push({ fecha: partido.fecha, partidos: [partido] });
  }
  return grupos;
}

const formatoDiaMesCorto = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const diaMesCorto = (fecha) => formatoDiaMesCorto.format(parsearFecha(fecha)).replace('.', '');

// Lunes de la semana a la que pertenece la fecha
export function lunesDeLaSemana(fecha) {
  const d = parsearFecha(fecha);
  return fechaDeHoy(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
}

// Agrupa una lista ya ordenada por semanas de lunes a domingo, y dentro de cada semana por días:
// [{ inicio, fin, titulo, rango, partidos, dias, total }]
export function agruparPorSemana(partidos, hoy = fechaDeHoy()) {
  const lunesActual = lunesDeLaSemana(hoy);
  const lunesSiguiente = sumarDias(lunesActual, 7);
  const semanas = [];

  for (const partido of partidos) {
    const inicio = lunesDeLaSemana(partido.fecha);
    let semana = semanas[semanas.length - 1];
    if (!semana || semana.inicio !== inicio) {
      const fin = sumarDias(inicio, 6);
      const rango = `${diaMesCorto(inicio)} – ${diaMesCorto(fin)}`;
      let titulo = `Semana del ${diaMesCorto(inicio)} al ${diaMesCorto(fin)}`;
      if (inicio === lunesActual) titulo = 'Esta semana';
      else if (inicio === lunesSiguiente) titulo = 'La semana que viene';
      semana = { inicio, fin, titulo, rango, partidos: [], total: 0 };
      semanas.push(semana);
    }
    semana.partidos.push(partido);
    semana.total += partido.importeCentimos || 0;
  }

  return semanas.map((semana) => ({ ...semana, dias: agruparPorDia(semana.partidos) }));
}

// Partidos de cada día (AAAA-MM-DD), ordenados por hora
export function partidosPorDia(partidos) {
  const mapa = new Map();
  for (const partido of [...partidos].sort(ordenCronologico)) {
    if (!mapa.has(partido.fecha)) mapa.set(partido.fecha, []);
    mapa.get(partido.fecha).push(partido);
  }
  return mapa;
}

function sumarDias(fecha, dias) {
  const d = parsearFecha(fecha);
  return fechaDeHoy(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias));
}

// "Hoy", "Mañana" o "Sábado, 21 de noviembre"
export function etiquetaDia(fecha, hoy = fechaDeHoy()) {
  if (fecha === hoy) return 'Hoy';
  if (fecha === sumarDias(hoy, 1)) return 'Mañana';
  return mayuscula(formatoDiaLargo.format(parsearFecha(fecha)));
}

// Días que faltan hasta la fecha (0 hoy, 1 mañana...)
export function diasHasta(fecha, hoy = fechaDeHoy()) {
  return Math.round((parsearFecha(fecha) - parsearFecha(hoy)) / (24 * 60 * 60 * 1000));
}

// "Noviembre de 2026"
export function nombreMesCalendario(anio, mes) {
  return mayuscula(formatoMesAnio.format(new Date(anio, mes, 1)));
}

// Semanas del mes (de lunes a domingo) con los días de los meses vecinos para completarlas.
// mes va de 0 (enero) a 11.
export function semanasDelMes(anio, mes) {
  const primero = new Date(anio, mes, 1);
  const desplazamiento = (primero.getDay() + 6) % 7; // lunes = 0
  const inicio = new Date(anio, mes, 1 - desplazamiento);
  const ultimo = new Date(anio, mes + 1, 0);
  const totalDias = Math.ceil((desplazamiento + ultimo.getDate()) / 7) * 7;

  const semanas = [];
  for (let i = 0; i < totalDias; i++) {
    const dia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    if (i % 7 === 0) semanas.push([]);
    semanas[semanas.length - 1].push({
      fecha: fechaDeHoy(dia),
      numero: dia.getDate(),
      delMes: dia.getMonth() === mes,
    });
  }
  return semanas;
}

// Enlace para abrir el campo en Google Maps (en el móvil abre la app de mapas)
export function enlaceMapa(campo) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(campo)}`;
}
