const formatoEuros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export const formatoDia = new Intl.DateTimeFormat('es-ES', { day: '2-digit' });
export const formatoMes = new Intl.DateTimeFormat('es-ES', { month: 'short' });
export const formatoFechaLarga = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// Los importes se guardan en céntimos (números enteros) para que las sumas sean exactas
export function formatearCentimos(centimos) {
  return formatoEuros.format(centimos / 100);
}

// Convierte lo que escribe el usuario ("25", "25,50", "25.5") a céntimos.
// Devuelve null si el texto no es un importe válido.
export function textoACentimos(texto) {
  const normalizado = String(texto).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  return Math.round(parseFloat(normalizado) * 100);
}

// Céntimos al texto que se muestra en el campo de importe: 4800 -> "48", 3550 -> "35,50"
export function centimosATexto(centimos) {
  return centimos % 100 === 0 ? String(centimos / 100) : (centimos / 100).toFixed(2).replace('.', ',');
}

// Fecha en formato AAAA-MM-DD según la hora local (no UTC)
export function fechaDeHoy(hoy = new Date()) {
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

// Interpreta "AAAA-MM-DD" como fecha local para que no se desplace un día por la zona horaria
export function parsearFecha(textoFecha) {
  const [anio, mes, dia] = textoFecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function textoPartidos(cantidad) {
  return cantidad === 1 ? '1 partido' : `${cantidad} partidos`;
}

// Del más reciente al más antiguo; a igual fecha, por hora (los que no tienen hora, al final del día)
// y, si coinciden, el último registrado primero
export function ordenarPorFecha(partidos) {
  return [...partidos].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || (b.hora || '').localeCompare(a.hora || '') || b.creadoEn - a.creadoEn
  );
}

export function generarId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
