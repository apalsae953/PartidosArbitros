import { describe, expect, it } from 'vitest';
import { analizarPdfs, buscarDuplicado } from './importarPdf.js';

function designacion(numero, fecha, local, visitante) {
  return (
    `Designación de ARBITRO Con fecha ${fecha} a las 12:00 , GARCIA LOPEZ, JUAN actuará como ARBITRO entre los equipos ${local} y ${visitante} ` +
    `de la 3ª Andaluza Alevín (Almería) , grupo Grupo Dos . El partido tendrá lugar en el campo Campo Municipal de Pueblo . ` +
    `Liquidación Euros Importe arbitraje 14,86 Gastos por manutención 0,00 Kilometraje 5,46 Total 20,32 Designación Nº: ${numero}`
  );
}

// Archivos falsos: el "contenido" es directamente el texto de sus páginas
function pdf(nombre, paginas, cambios = {}) {
  return { name: nombre, type: 'application/pdf', size: 40000, paginas, ...cambios };
}
const leerFalso = async (archivo) => {
  if (archivo.error) throw archivo.error;
  return archivo.paginas;
};

describe('analizarPdfs', () => {
  it('lee varios PDF y marca los repetidos', async () => {
    const existentes = [{ fecha: '2026-11-01', local: 'C.D. A', visitante: 'C.D. B', designacion: '1000' }];
    const resultados = await analizarPdfs(
      [
        pdf('nuevo.pdf', [designacion('2000', '14-11-2026', 'C.D. VERA', 'CARBONERAS C.F.')]),
        pdf('ya-registrado.pdf', [designacion('1000', '01-11-2026', 'C.D. A', 'C.D. B')]),
        pdf('nuevo-otra-vez.pdf', [designacion('2000', '14-11-2026', 'C.D. VERA', 'CARBONERAS C.F.')]),
      ],
      existentes,
      leerFalso
    );
    expect(resultados.map((r) => [r.ok, r.duplicado])).toEqual([
      [true, false],
      [true, true],
      [true, true],
    ]);
    expect(resultados[0].partido.local).toBe('C.D. VERA');
  });

  it('explica por qué no se ha podido leer cada archivo', async () => {
    const protegido = Object.assign(new Error('x'), { name: 'PasswordException' });
    const resultados = await analizarPdfs(
      [
        pdf('foto.jpg', [], { type: 'image/jpeg' }),
        pdf('enorme.pdf', [], { size: 50 * 1024 * 1024 }),
        pdf('protegido.pdf', [], { error: protegido }),
        pdf('factura.pdf', ['Factura nº 7 Total 50,00']),
      ],
      [],
      leerFalso
    );
    expect(resultados.every((r) => r.ok === false)).toBe(true);
    expect(resultados.map((r) => r.motivo)).toEqual([
      'No es un archivo PDF.',
      'El archivo es demasiado grande.',
      'El PDF está protegido con contraseña.',
      'No parece un PDF de designación de la RFAF.',
    ]);
  });
});

describe('buscarDuplicado', () => {
  const existentes = [{ fecha: '2026-11-14', local: 'C.D. Vera', visitante: 'Carboneras C.F.' }];

  it('reconoce el mismo partido aunque cambien mayúsculas o tildes', () => {
    expect(buscarDuplicado({ fecha: '2026-11-14', local: 'C.D. VERA', visitante: 'CARBONERAS C.F.' }, existentes)).toBeTruthy();
  });

  it('distingue partidos de los mismos equipos el mismo día con distinta designación', () => {
    // Torneo de escuelas: prebenjamines a las 10:00 y alevines a las 11:00
    const prebenjamin = {
      fecha: '2026-11-14',
      hora: '10:00',
      local: 'E.F. MACAEL',
      visitante: 'E.F. VERA',
      categoria: 'TOR-PRE-F7-M-CEDIFA',
      designacion: '2012623',
    };
    const alevin = { ...prebenjamin, hora: '11:00', categoria: 'TOR-ALE-F7-M-CEDIFA', designacion: '2012624' };
    expect(buscarDuplicado(alevin, [prebenjamin])).toBeNull();
    expect(buscarDuplicado({ ...alevin }, [prebenjamin, alevin])).toBe(alevin);
  });

  it('sin designación, distingue por la hora si se conoce en los dos', () => {
    const manual = { fecha: '2026-11-14', hora: '10:00', local: 'E.F. MACAEL', visitante: 'E.F. VERA' };
    expect(buscarDuplicado({ ...manual, hora: '11:00', designacion: '2012624' }, [manual])).toBeNull();
    expect(buscarDuplicado({ ...manual, designacion: '2012623' }, [manual])).toBe(manual);
    // Si a uno le falta la hora, se considera el mismo partido para no duplicarlo
    const sinHora = { fecha: '2026-11-14', local: 'E.F. MACAEL', visitante: 'E.F. VERA' };
    expect(buscarDuplicado({ ...manual, designacion: '2012623' }, [sinHora])).toBe(sinHora);
  });

  it('no confunde partidos de otra fecha', () => {
    expect(buscarDuplicado({ fecha: '2026-11-21', local: 'C.D. VERA', visitante: 'CARBONERAS C.F.' }, existentes)).toBeNull();
  });
});
