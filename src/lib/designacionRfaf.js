import { normalizarTexto } from './temporadas.js';

// Lector de las designaciones del Comité Técnico de Árbitros de la RFAF (PDF de "Designación de ARBITRO").
// Recibe el texto de cada página del PDF y devuelve los datos del partido.
//
// Página 1 (designación): fecha, hora, equipos, competición, campo y la liquidación del árbitro.
// Páginas siguientes (recibos y liquidación por club): se usan solo para separar bien los nombres de los equipos.
// No se guardan los nombres ni teléfonos del equipo arbitral que aparecen en el documento.

export function normalizarTextoPdf(texto) {
  return texto
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;])/g, '$1')
    .trim();
}

// "20,32" -> 2032
function eurosACentimos(texto) {
  const [enteros, decimales = '0'] = texto.replace(/\./g, '').split(',');
  return Number(enteros) * 100 + Number(decimales.padEnd(2, '0').slice(0, 2));
}

function buscarImporte(texto, concepto) {
  const resultado = texto.match(new RegExp(`${concepto}\\s+(\\d{1,4}(?:\\.\\d{3})*,\\d{2})`, 'i'));
  return resultado ? eurosACentimos(resultado[1]) : null;
}

// Nombres de los clubes según los recibos y las liquidaciones (pueden ser más largos que en la designación)
function clubesDelDocumento(textoCompleto) {
  const clubes = [];
  for (const [, club] of textoCompleto.matchAll(/telem[aá]tica del club (.+?) de \S[^,]*? la cantidad/g)) clubes.push(club);
  for (const [, club] of textoCompleto.matchAll(/Liquidaci[oó]n (.+?) Euros Importe/g)) clubes.push(club);
  return clubes.map(normalizarTexto);
}

function seParecen(equipo, club) {
  const a = normalizarTexto(equipo);
  return a.length > 0 && (club.startsWith(a) || a.startsWith(club));
}

// "C.D. VERA y CARBONERAS C.F." -> ["C.D. VERA", "CARBONERAS C.F."].
// Si algún nombre contiene " y ", se elige el corte que coincide con los clubes del documento.
export function separarEquipos(texto, clubes = []) {
  const cortes = [];
  for (let i = texto.indexOf(' y '); i !== -1; i = texto.indexOf(' y ', i + 1)) cortes.push(i);
  if (cortes.length === 0) return null;

  const opciones = cortes.map((i) => [texto.slice(0, i).trim(), texto.slice(i + 3).trim()]);
  if (opciones.length > 1 && clubes.length > 0) {
    const coincidente = opciones.find(
      ([local, visitante]) => clubes.some((c) => seParecen(local, c)) && clubes.some((c) => seParecen(visitante, c))
    );
    if (coincidente) return coincidente;
  }
  return opciones[0];
}

// "3ª Andaluza Juvenil (Almería)" -> "3ª Andaluza Juvenil"
function quitarProvincia(competicion) {
  return competicion.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function interpretarDesignacion(paginas) {
  const textos = paginas.map(normalizarTextoPdf);
  const designacion = textos.find((t) => /Designaci[oó]n de /i.test(t) && /Con fecha \d/.test(t));
  if (!designacion) {
    return { ok: false, motivo: 'No parece un PDF de designación de la RFAF.' };
  }

  // La frase principal va de "Con fecha" a "El partido tendrá lugar" (o al bloque de personal designado)
  const inicio = designacion.indexOf('Con fecha');
  const finCampo = designacion.search(/El partido tendr[aá] lugar|Personal designado/);
  const frase = designacion.slice(inicio, finCampo === -1 ? undefined : finCampo);

  const fechaHora = frase.match(/Con fecha (\d{1,2})-(\d{1,2})-(\d{4}) a las (\d{1,2}):(\d{2})/);
  const partido = frase.match(/entre los equipos (.+) de la (.+?), grupo (.+?)\.?\s*$/);
  if (!fechaHora || !partido) {
    return { ok: false, motivo: 'No se han encontrado la fecha o los equipos del partido.' };
  }

  const equipos = separarEquipos(partido[1], clubesDelDocumento(textos.join(' ')));
  if (!equipos) {
    return { ok: false, motivo: 'No se han podido separar los equipos local y visitante.' };
  }

  const [, dia, mes, anio, hora, minutos] = fechaHora;
  const funcion = frase.match(/actuar[aá] como (.+?) entre los equipos/)?.[1].trim() || '';
  const campo = designacion.match(/tendr[aá] lugar en el campo (.+?) de [^.]+\./)?.[1].trim() || '';
  const numero = designacion.match(/Designaci[oó]n N\S*\s*:?\s*(\d{3,})/)?.[1] || '';

  // Liquidación del árbitro (tabla de la página de designación)
  const tabla = designacion.slice(Math.max(designacion.search(/Liquidaci[oó]n Euros/), 0));
  const desglose = {
    arbitraje: buscarImporte(tabla, 'Importe arbitraje'),
    manutencion: buscarImporte(tabla, 'Gastos por manutenci[oó]n'),
    kilometraje: buscarImporte(tabla, 'Kilometraje'),
    total: buscarImporte(tabla, 'Total'),
  };
  const suma = (desglose.arbitraje || 0) + (desglose.manutencion || 0) + (desglose.kilometraje || 0);
  const importeCentimos = desglose.total ?? suma;
  if (!importeCentimos) {
    return { ok: false, motivo: 'No se ha encontrado el importe de la liquidación.' };
  }

  const avisos = [];
  if (funcion && normalizarTexto(funcion) !== 'arbitro') avisos.push(`En esta designación actúas como ${funcion.toLowerCase()}.`);
  if (desglose.total !== null && suma > 0 && suma !== desglose.total) {
    avisos.push('El total no coincide con la suma de conceptos; revisa el importe.');
  }

  return {
    ok: true,
    avisos,
    desglose,
    partido: {
      fecha: `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`,
      hora: `${hora.padStart(2, '0')}:${minutos}`,
      local: equipos[0],
      visitante: equipos[1],
      categoria: quitarProvincia(partido[2]),
      importeCentimos,
      campo,
      designacion: numero,
    },
  };
}
