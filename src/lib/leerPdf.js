// Lectura de PDF en el propio navegador con pdf.js (Mozilla). El archivo nunca sale del dispositivo.
// pdf.js es grande, así que se descarga solo la primera vez que se importa un PDF.
// Se usa la versión "legacy", compatible también con móviles algo antiguos.

let cargaPdfjs = null;

function cargarPdfjs() {
  if (!cargaPdfjs) {
    cargaPdfjs = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ])
      .then(([pdfjs, { default: urlTrabajador }]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = urlTrabajador;
        return pdfjs;
      })
      .catch((error) => {
        // Si falla (por ejemplo, sin conexión la primera vez), se podrá reintentar
        cargaPdfjs = null;
        throw error;
      });
  }
  return cargaPdfjs;
}

// Una designación tiene 4 páginas; no hace falta leer más
const MAX_PAGINAS = 10;

// Devuelve el texto de cada página del PDF
export async function leerPaginasPdf(archivo) {
  const pdfjs = await cargarPdfjs();
  // La tarea de carga es la que libera el documento y su trabajador al terminar
  const tarea = pdfjs.getDocument({
    data: new Uint8Array(await archivo.arrayBuffer()),
    isEvalSupported: false,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  });

  try {
    const documento = await tarea.promise;
    const paginas = [];
    for (let numero = 1; numero <= Math.min(documento.numPages, MAX_PAGINAS); numero++) {
      const contenido = await (await documento.getPage(numero)).getTextContent();
      paginas.push(contenido.items.map((item) => item.str ?? '').join(' '));
    }
    return paginas;
  } finally {
    await tarea.destroy();
  }
}
