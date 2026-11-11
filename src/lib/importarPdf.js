import { interpretarDesignacion } from './designacionRfaf.js';
import { normalizarTexto } from './temporadas.js';

export const MAX_BYTES_PDF = 10 * 1024 * 1024;
export const MAX_PDF_POR_VEZ = 30;

export function esPdf(archivo) {
  return archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name);
}

// Un partido ya registrado: mismo nº de designación, o misma fecha y mismos equipos
export function buscarDuplicado(partido, existentes) {
  const clave = (p) => `${p.fecha}|${normalizarTexto(p.local)}|${normalizarTexto(p.visitante)}`;
  return (
    existentes.find((p) => partido.designacion && p.designacion === partido.designacion) ||
    existentes.find((p) => clave(p) === clave(partido)) ||
    null
  );
}

function motivoDeError(error) {
  if (error?.name === 'PasswordException') return 'El PDF está protegido con contraseña.';
  if (error?.name === 'InvalidPDFException') return 'El archivo está dañado o no es un PDF válido.';
  // Fallo al descargar pdf.js (mensajes de Chrome/Edge, Firefox y Safari)
  if (/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error?.message || '')) {
    return 'No se ha podido cargar el lector de PDF. Comprueba la conexión y vuelve a intentarlo.';
  }
  return 'No se ha podido leer el PDF.';
}

// Lee varios PDF y devuelve, para cada uno, el partido encontrado o el motivo por el que no se pudo leer.
// "leer" se puede sustituir en los tests para no depender de pdf.js.
export async function analizarPdfs(archivos, existentes, leer) {
  const resultados = [];
  const yaVistos = [...existentes];

  for (const [indice, archivo] of [...archivos].entries()) {
    const base = { id: `${indice}-${archivo.name}`, archivo: archivo.name };
    if (indice >= MAX_PDF_POR_VEZ) {
      resultados.push({ ...base, ok: false, motivo: `Solo se pueden importar ${MAX_PDF_POR_VEZ} PDF a la vez.` });
      continue;
    }
    if (!esPdf(archivo)) {
      resultados.push({ ...base, ok: false, motivo: 'No es un archivo PDF.' });
      continue;
    }
    if (archivo.size > MAX_BYTES_PDF) {
      resultados.push({ ...base, ok: false, motivo: 'El archivo es demasiado grande.' });
      continue;
    }

    try {
      const lectura = interpretarDesignacion(await leer(archivo));
      if (!lectura.ok) {
        resultados.push({ ...base, ...lectura });
        continue;
      }
      const duplicado = buscarDuplicado(lectura.partido, yaVistos);
      resultados.push({ ...base, ...lectura, duplicado: Boolean(duplicado) });
      yaVistos.push(lectura.partido);
    } catch (error) {
      console.warn(`No se pudo leer ${archivo.name}`, error);
      resultados.push({ ...base, ok: false, motivo: motivoDeError(error) });
    }
  }
  return resultados;
}
