import { describe, expect, it } from 'vitest';
import { celdaCSV, combinarPartidos, generarCSV, generarJSON, leerCopia } from './copiaSeguridad.js';
import { esPartidoValido } from './almacenamiento.js';
import { calcularResumen } from '../components/PanelEstadisticas.jsx';
import { diasSinCopia } from '../components/RecordatorioCopia.jsx';

function partido(id, cambios = {}) {
  return {
    id,
    creadoEn: 1,
    fecha: '2026-10-25',
    local: 'CD Ribera',
    visitante: 'UD Montaña',
    categoria: 'Juvenil',
    importeCentimos: 3550,
    estado: 'pendiente',
    ...cambios,
  };
}

describe('esPartidoValido', () => {
  it('acepta un partido correcto', () => {
    expect(esPartidoValido(partido('a'))).toBe(true);
  });

  it('rechaza datos incompletos o incorrectos', () => {
    expect(esPartidoValido(null)).toBe(false);
    expect(esPartidoValido(partido('a', { fecha: '25/10/2026' }))).toBe(false);
    expect(esPartidoValido(partido('a', { importeCentimos: 35.5 }))).toBe(false);
    expect(esPartidoValido(partido('a', { importeCentimos: -100 }))).toBe(false);
    expect(esPartidoValido(partido('a', { estado: 'otro' }))).toBe(false);
    expect(esPartidoValido(partido('a', { local: '' }))).toBe(false);
    expect(esPartidoValido(partido('a', { local: 'x'.repeat(201) }))).toBe(false);
  });
});

describe('exportar e importar', () => {
  it('lo exportado en JSON se puede volver a importar sin cambios', () => {
    const partidos = [partido('a'), partido('b', { estado: 'cobrado', importeCentimos: 4800 })];
    const { partidos: importados, descartados } = leerCopia(generarJSON(partidos));
    expect(importados).toEqual(partidos);
    expect(descartados).toBe(0);
  });

  it('acepta también una lista simple de partidos', () => {
    expect(leerCopia(JSON.stringify([partido('a')])).partidos).toHaveLength(1);
  });

  it('descarta registros no válidos y repetidos, y los campos desconocidos', () => {
    const texto = JSON.stringify({
      partidos: [partido('a', { extra: '<script>' }), partido('a'), { id: 'x' }, partido('b')],
    });
    const { partidos, descartados } = leerCopia(texto);
    expect(partidos.map((p) => p.id)).toEqual(['a', 'b']);
    expect(partidos[0]).not.toHaveProperty('extra');
    expect(descartados).toBe(2);
  });

  it('lanza un error si el archivo no es una copia', () => {
    expect(() => leerCopia('esto no es json')).toThrow();
    expect(() => leerCopia(JSON.stringify({ otra: 'cosa' }))).toThrow();
    expect(() => leerCopia('null')).toThrow();
  });
});

describe('combinarPartidos', () => {
  const actuales = [partido('a'), partido('b')];
  const importados = [partido('b', { importeCentimos: 1 }), partido('c')];

  it('al combinar añade solo los nuevos y no toca los existentes', () => {
    const resultado = combinarPartidos(actuales, importados, 'combinar');
    expect(resultado.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(resultado[1].importeCentimos).toBe(3550);
  });

  it('al reemplazar deja solo los del archivo', () => {
    expect(combinarPartidos(actuales, importados, 'reemplazar')).toBe(importados);
  });
});

describe('generarCSV', () => {
  it('genera un CSV compatible con Excel en español', () => {
    const csv = generarCSV([partido('a'), partido('b', { fecha: '2026-11-01', estado: 'cobrado', importeCentimos: 4800 })]);
    expect(csv.startsWith('﻿')).toBe(true);
    const lineas = csv.slice(1).split('\r\n');
    expect(lineas[0]).toBe('Fecha;Equipo local;Equipo visitante;Categoría;Importe (€);Estado');
    expect(lineas[1]).toBe('01/11/2026;CD Ribera;UD Montaña;Juvenil;48,00;Cobrado');
    expect(lineas[2]).toBe('25/10/2026;CD Ribera;UD Montaña;Juvenil;35,50;Pendiente');
  });

  it('escapa comillas y separadores, y neutraliza fórmulas', () => {
    expect(celdaCSV('CF "Puerto"')).toBe('"CF ""Puerto"""');
    expect(celdaCSV('A; B')).toBe('"A; B"');
    expect(celdaCSV('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(celdaCSV('+34')).toBe("'+34");
    expect(celdaCSV('-1')).toBe("'-1");
    expect(celdaCSV('@SUM')).toBe("'@SUM");
  });
});

describe('calcularResumen', () => {
  it('suma totales exactos en céntimos', () => {
    const resumen = calcularResumen([
      partido('a', { importeCentimos: 3550 }),
      partido('b', { importeCentimos: 4800, estado: 'cobrado' }),
      partido('c', { importeCentimos: 1875 }),
    ]);
    expect(resumen).toEqual({ total: 10225, cobrado: 4800, pendiente: 5425, numPendientes: 2, porcentajeCobrado: 47 });
  });

  it('no divide entre cero sin partidos', () => {
    expect(calcularResumen([]).porcentajeCobrado).toBe(0);
  });
});

describe('diasSinCopia', () => {
  const dia = 24 * 60 * 60 * 1000;
  const ahora = Date.UTC(2026, 10, 3);

  it('no recuerda nada si no hay partidos', () => {
    expect(diasSinCopia(null, 0, ahora)).toBeNull();
  });

  it('recuerda si nunca se hizo copia', () => {
    expect(diasSinCopia(null, 2, ahora)).toBe(Infinity);
  });

  it('recuerda a partir de 30 días', () => {
    expect(diasSinCopia(ahora - 29 * dia, 2, ahora)).toBeNull();
    expect(diasSinCopia(ahora - 30 * dia, 2, ahora)).toBe(30);
  });
});
