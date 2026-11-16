import { describe, expect, it } from 'vitest';
import {
  agruparPorDia,
  agruparPorSemana,
  diasHasta,
  enlaceMapa,
  etiquetaDia,
  lunesDeLaSemana,
  nombreMesCalendario,
  partidosPorDia,
  proximosPartidos,
  semanasDelMes,
} from './calendario.js';

const partido = (id, fecha, hora) => ({ id, fecha, ...(hora ? { hora } : {}) });

describe('proximosPartidos', () => {
  // Lunes 16 de noviembre de 2026 a las 18:30
  const ahora = new Date(2026, 10, 16, 18, 30);

  it('incluye los que aún no se han pitado y los ordena por fecha y hora', () => {
    const partidos = [
      partido('sabado-11', '2026-11-21', '11:00'),
      partido('ayer', '2026-11-15', '10:00'),
      partido('sabado-10', '2026-11-21', '10:00'),
      partido('sabado-sin-hora', '2026-11-21'),
      partido('hoy-17', '2026-11-16', '17:00'),
    ];
    expect(proximosPartidos(partidos, ahora).map((p) => p.id)).toEqual([
      'hoy-17',
      'sabado-10',
      'sabado-11',
      'sabado-sin-hora',
    ]);
  });

  it('un partido deja de ser próximo 2 horas después de empezar', () => {
    expect(proximosPartidos([partido('a', '2026-11-16', '16:31')], ahora)).toHaveLength(1);
    expect(proximosPartidos([partido('a', '2026-11-16', '16:30')], ahora)).toHaveLength(0);
  });

  it('sin hora, es próximo hasta que acaba el día', () => {
    expect(proximosPartidos([partido('a', '2026-11-16')], ahora)).toHaveLength(1);
    expect(proximosPartidos([partido('a', '2026-11-16')], new Date(2026, 10, 17, 0, 0))).toHaveLength(0);
  });
});

describe('agrupaciones por día', () => {
  it('agrupa una lista ordenada por día', () => {
    const grupos = agruparPorDia([partido('a', '2026-11-21', '10:00'), partido('b', '2026-11-21', '11:00'), partido('c', '2026-11-22')]);
    expect(grupos.map((g) => [g.fecha, g.partidos.map((p) => p.id)])).toEqual([
      ['2026-11-21', ['a', 'b']],
      ['2026-11-22', ['c']],
    ]);
  });

  it('indexa por día y ordena por hora', () => {
    const mapa = partidosPorDia([partido('tarde', '2026-11-21', '18:00'), partido('manana', '2026-11-21', '10:00')]);
    expect(mapa.get('2026-11-21').map((p) => p.id)).toEqual(['manana', 'tarde']);
  });
});

describe('agruparPorSemana', () => {
  // Hoy es lunes 16 de noviembre de 2026
  const hoy = '2026-11-16';
  const conImporte = (id, fecha, importe) => ({ id, fecha, importeCentimos: importe });

  it('agrupa por semanas de lunes a domingo, incluidos los partidos entre semana', () => {
    const semanas = agruparPorSemana(
      [
        conImporte('miercoles', '2026-11-18', 2000),
        conImporte('sabado', '2026-11-21', 1150),
        conImporte('domingo', '2026-11-22', 5124),
        conImporte('martes-siguiente', '2026-11-24', 3000),
        conImporte('diciembre', '2026-12-05', 4000),
      ],
      hoy
    );
    expect(semanas.map((s) => [s.titulo, s.rango, s.partidos.map((p) => p.id), s.total])).toEqual([
      ['Esta semana', '16 nov – 22 nov', ['miercoles', 'sabado', 'domingo'], 8274],
      ['La semana que viene', '23 nov – 29 nov', ['martes-siguiente'], 3000],
      ['Semana del 30 nov al 6 dic', '30 nov – 6 dic', ['diciembre'], 4000],
    ]);
    expect(semanas[0].dias.map((d) => d.fecha)).toEqual(['2026-11-18', '2026-11-21', '2026-11-22']);
  });

  it('el domingo pertenece a la semana que empezó el lunes anterior', () => {
    expect(lunesDeLaSemana('2026-11-22')).toBe('2026-11-16');
    expect(lunesDeLaSemana('2026-11-16')).toBe('2026-11-16');
    expect(lunesDeLaSemana('2027-01-01')).toBe('2026-12-28');
  });

  it('un domingo, "esta semana" sigue siendo la que acaba ese día', () => {
    const semanas = agruparPorSemana([conImporte('hoy', '2026-11-22', 0), conImporte('lunes', '2026-11-23', 0)], '2026-11-22');
    expect(semanas.map((s) => s.titulo)).toEqual(['Esta semana', 'La semana que viene']);
  });
});

describe('textos de fechas', () => {
  it('usa Hoy, Mañana o el día de la semana', () => {
    expect(etiquetaDia('2026-11-16', '2026-11-16')).toBe('Hoy');
    expect(etiquetaDia('2026-11-17', '2026-11-16')).toBe('Mañana');
    expect(etiquetaDia('2026-11-21', '2026-11-16')).toBe('Sábado, 21 de noviembre');
    expect(etiquetaDia('2027-01-01', '2026-12-31')).toBe('Mañana');
  });

  it('cuenta los días que faltan', () => {
    expect(diasHasta('2026-11-21', '2026-11-16')).toBe(5);
    expect(diasHasta('2026-11-16', '2026-11-16')).toBe(0);
  });

  it('nombra el mes con mayúscula', () => {
    expect(nombreMesCalendario(2026, 10)).toBe('Noviembre de 2026');
  });
});

describe('semanasDelMes', () => {
  it('empieza en lunes y completa las semanas con días de los meses vecinos', () => {
    // Noviembre de 2026 empieza en domingo
    const semanas = semanasDelMes(2026, 10);
    expect(semanas[0][0]).toEqual({ fecha: '2026-10-26', numero: 26, delMes: false });
    expect(semanas[0][6]).toEqual({ fecha: '2026-11-01', numero: 1, delMes: true });
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    const ultima = semanas[semanas.length - 1];
    expect(ultima.some((d) => d.fecha === '2026-11-30')).toBe(true);
    expect(semanas.flat().filter((d) => d.delMes)).toHaveLength(30);
  });

  it('funciona con febrero y cambio de año', () => {
    expect(semanasDelMes(2027, 1).flat().filter((d) => d.delMes)).toHaveLength(28);
    expect(semanasDelMes(2026, 11).flat().at(-1).fecha).toBe('2027-01-03');
  });
});

describe('enlaceMapa', () => {
  it('codifica el nombre del campo', () => {
    expect(enlaceMapa('Vera - CAMPO LAS VIÑAS (F-11, F-7)')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Vera%20-%20CAMPO%20LAS%20VI%C3%91AS%20(F-11%2C%20F-7)'
    );
  });
});
