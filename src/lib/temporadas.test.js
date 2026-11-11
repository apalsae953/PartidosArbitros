import { describe, expect, it } from 'vitest';
import {
  agruparPorMes,
  categoriasFrecuentes,
  filtrarPartidos,
  importeSugerido,
  mesesDeTemporada,
  nombreMes,
  nombreTemporada,
  resumenMensual,
  temporadaDe,
  temporadaInicial,
  temporadasDisponibles,
} from './temporadas.js';
import { centimosATexto } from './formato.js';

function partido(id, fecha, cambios = {}) {
  return {
    id,
    creadoEn: 1,
    fecha,
    local: 'CD Ribera',
    visitante: 'UD Montaña',
    categoria: 'Juvenil',
    importeCentimos: 3000,
    estado: 'pendiente',
    ...cambios,
  };
}

describe('temporadas', () => {
  it('cambian de temporada el 1 de julio', () => {
    expect(temporadaDe('2026-06-30')).toBe('2025');
    expect(temporadaDe('2026-07-01')).toBe('2026');
    expect(temporadaDe('2027-01-15')).toBe('2026');
    expect(nombreTemporada('2026')).toBe('2026/27');
  });

  it('cada temporada tiene los meses de julio a junio', () => {
    const meses = mesesDeTemporada('2026');
    expect(meses).toHaveLength(12);
    expect(meses[0]).toBe('2026-07');
    expect(meses[5]).toBe('2026-12');
    expect(meses[6]).toBe('2027-01');
    expect(meses[11]).toBe('2027-06');
  });

  it('lista las temporadas con partidos más la actual, de la más reciente a la más antigua', () => {
    const partidos = [partido('a', '2024-10-01'), partido('b', '2025-11-01')];
    expect(temporadasDisponibles(partidos, null, '2026-11-11')).toEqual(['2026', '2025', '2024']);
  });

  it('empieza en la temporada actual, salvo que esté vacía y haya partidos de otras', () => {
    expect(temporadaInicial([], '2026-11-11')).toBe('2026');
    expect(temporadaInicial([partido('a', '2026-09-01')], '2026-11-11')).toBe('2026');
    expect(temporadaInicial([partido('a', '2024-10-01'), partido('b', '2025-11-01')], '2026-11-11')).toBe('2025');
  });

  it('pone el nombre del mes con mayúscula', () => {
    expect(nombreMes('2026-10')).toBe('Octubre de 2026');
  });
});

describe('filtrarPartidos', () => {
  const partidos = [
    partido('a', '2026-10-05'),
    partido('b', '2026-11-02', { estado: 'cobrado', local: 'Atlético Vega' }),
    partido('c', '2025-10-05'),
  ];

  it('filtra por temporada, mes y estado', () => {
    expect(filtrarPartidos(partidos, { temporada: '2026' }).map((p) => p.id)).toEqual(['a', 'b']);
    expect(filtrarPartidos(partidos, { temporada: 'todas' })).toHaveLength(3);
    expect(filtrarPartidos(partidos, { mes: '2026-11' }).map((p) => p.id)).toEqual(['b']);
    expect(filtrarPartidos(partidos, { estado: 'cobrado' }).map((p) => p.id)).toEqual(['b']);
  });

  it('busca sin distinguir mayúsculas ni tildes', () => {
    expect(filtrarPartidos(partidos, { busqueda: 'atletico' }).map((p) => p.id)).toEqual(['b']);
    expect(filtrarPartidos(partidos, { busqueda: 'MONTANA' })).toHaveLength(3);
    expect(filtrarPartidos(partidos, { busqueda: 'juvenil' })).toHaveLength(3);
  });
});

describe('agrupaciones', () => {
  it('agrupa por mes con su total', () => {
    const grupos = agruparPorMes([
      partido('a', '2026-10-05'),
      partido('b', '2026-11-02', { importeCentimos: 4800 }),
      partido('c', '2026-10-20'),
    ]);
    expect(grupos.map((g) => [g.mes, g.partidos.map((p) => p.id), g.total])).toEqual([
      ['2026-11', ['b'], 4800],
      ['2026-10', ['c', 'a'], 6000],
    ]);
  });

  it('resume cobrado y pendiente por mes de la temporada', () => {
    const meses = resumenMensual(
      [
        partido('a', '2026-10-05'),
        partido('b', '2026-10-12', { estado: 'cobrado', importeCentimos: 4800 }),
        partido('c', '2025-10-05'),
      ],
      '2026'
    );
    const octubre = meses.find((m) => m.mes === '2026-10');
    expect(octubre).toEqual({ mes: '2026-10', cobrado: 4800, pendiente: 3000, partidos: 2 });
    expect(meses.reduce((suma, m) => suma + m.partidos, 0)).toBe(2);
  });
});

describe('ayudas del formulario', () => {
  const partidos = [
    partido('a', '2026-10-05', { categoria: 'Juvenil', importeCentimos: 3000, creadoEn: 1 }),
    partido('b', '2026-10-12', { categoria: 'juvenil', importeCentimos: 3550, creadoEn: 2 }),
    partido('c', '2026-10-19', { categoria: 'Senior', importeCentimos: 4800, creadoEn: 3 }),
  ];

  it('sugiere el importe del último partido de la misma categoría', () => {
    expect(importeSugerido(partidos, 'Juvenil')).toBe(3550);
    expect(importeSugerido(partidos, ' SENIOR ')).toBe(4800);
    expect(importeSugerido(partidos, 'Alevín')).toBeNull();
    expect(importeSugerido(partidos, '')).toBeNull();
  });

  it('ordena las categorías por uso', () => {
    expect(categoriasFrecuentes(partidos)).toEqual(['Juvenil', 'Senior']);
  });

  it('muestra los importes sin decimales innecesarios', () => {
    expect(centimosATexto(4800)).toBe('48');
    expect(centimosATexto(3550)).toBe('35,50');
    expect(centimosATexto(1875)).toBe('18,75');
  });
});
