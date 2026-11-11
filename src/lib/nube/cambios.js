// Cálculos puros para sincronizar la lista de partidos con la base de datos (sin depender de Firebase)

// Los campos que se guardan en cada documento (el id es el nombre del documento)
export function datosDocumento(partido) {
  const { id, ...datos } = partido;
  return datos;
}

function iguales(a, b) {
  const claves = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const clave of claves) if (a[clave] !== b[clave]) return false;
  return true;
}

// Compara la lista antes y después de un cambio y devuelve qué documentos hay que guardar y cuáles borrar
export function calcularCambios(anteriores, nuevos) {
  const porId = new Map(anteriores.map((p) => [p.id, p]));
  const guardar = nuevos.filter((p) => {
    const previo = porId.get(p.id);
    return !previo || !iguales(previo, p);
  });
  const idsNuevos = new Set(nuevos.map((p) => p.id));
  const eliminar = anteriores.filter((p) => !idsNuevos.has(p.id)).map((p) => p.id);
  return { guardar, eliminar };
}

// Firestore admite hasta 500 operaciones por lote; se usa un margen
export function dividirEnLotes(operaciones, tamano = 400) {
  const lotes = [];
  for (let i = 0; i < operaciones.length; i += tamano) lotes.push(operaciones.slice(i, i + tamano));
  return lotes;
}
