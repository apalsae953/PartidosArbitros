import { ETIQUETAS_ESTADO } from './constantes.js';
import { esPartidoValido } from './almacenamiento.js';
import { fechaDeHoy, ordenarPorFecha } from './formato.js';

// =========================================================================
// Exportación
// =========================================================================

// Copia completa en JSON: conserva todos los campos y sirve para restaurar los datos
export function generarJSON(partidos, momento = new Date()) {
  const copia = {
    aplicacion: 'Mis Arbitrajes',
    version: 1,
    exportadoEn: momento.toISOString(),
    partidos,
  };
  return JSON.stringify(copia, null, 2);
}

// Escapa un valor para CSV. Los textos que empiezan por =, +, - o @ se protegen
// para que Excel no los interprete como fórmulas.
export function celdaCSV(valor) {
  let texto = String(valor);
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// CSV con separador ";" y coma decimal, que es lo que espera Excel en español.
// El BOM inicial hace que Excel lea bien las tildes y la ñ.
export function generarCSV(partidos) {
  const cabecera = ['Fecha', 'Equipo local', 'Equipo visitante', 'Categoría', 'Importe (€)', 'Estado'];
  const filas = ordenarPorFecha(partidos).map((p) => [
    p.fecha.split('-').reverse().join('/'),
    p.local,
    p.visitante,
    p.categoria,
    (p.importeCentimos / 100).toFixed(2).replace('.', ','),
    ETIQUETAS_ESTADO[p.estado],
  ]);
  return '﻿' + [cabecera, ...filas].map((fila) => fila.map(celdaCSV).join(';')).join('\r\n');
}

function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera la URL un poco después para no cortar la descarga en algunos navegadores
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportarJSON(partidos) {
  descargarArchivo(`arbitrajes-${fechaDeHoy()}.json`, generarJSON(partidos), 'application/json');
}

export function exportarCSV(partidos) {
  descargarArchivo(`arbitrajes-${fechaDeHoy()}.csv`, generarCSV(partidos), 'text/csv;charset=utf-8');
}

// =========================================================================
// Importación
// =========================================================================

// Lee una copia exportada por la app (o un listado de partidos) y se queda solo con los válidos.
// Lanza un error si el texto no es JSON o no tiene el formato esperado.
export function leerCopia(texto) {
  const datos = JSON.parse(texto);
  const lista = Array.isArray(datos) ? datos : datos && Array.isArray(datos.partidos) ? datos.partidos : null;
  if (!lista) throw new Error('Formato de copia no reconocido');

  const idsVistos = new Set();
  const validos = [];
  for (const partido of lista) {
    if (!esPartidoValido(partido) || idsVistos.has(partido.id)) continue;
    idsVistos.add(partido.id);
    // Solo se copian los campos conocidos, ignorando cualquier otro que traiga el archivo
    validos.push({
      id: partido.id,
      creadoEn: Number.isFinite(partido.creadoEn) ? partido.creadoEn : 0,
      fecha: partido.fecha,
      local: partido.local,
      visitante: partido.visitante,
      categoria: partido.categoria,
      importeCentimos: partido.importeCentimos,
      estado: partido.estado,
    });
  }
  return { partidos: validos, descartados: lista.length - validos.length };
}

// "combinar" añade solo los partidos que aún no existen; "reemplazar" sustituye todos los datos
export function combinarPartidos(actuales, importados, modo) {
  if (modo === 'reemplazar') return importados;
  const idsActuales = new Set(actuales.map((partido) => partido.id));
  return [...actuales, ...importados.filter((partido) => !idsActuales.has(partido.id))];
}
