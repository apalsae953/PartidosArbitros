import { describe, expect, it } from 'vitest';
import { fechaDeHoy, ordenarPorFecha, parsearFecha, textoACentimos, textoPartidos } from './formato.js';

describe('textoACentimos', () => {
  it('acepta coma o punto como separador decimal', () => {
    expect(textoACentimos('25')).toBe(2500);
    expect(textoACentimos('25,50')).toBe(2550);
    expect(textoACentimos('25.5')).toBe(2550);
    expect(textoACentimos(' 18,75 ')).toBe(1875);
  });

  it('evita errores de redondeo de los decimales', () => {
    expect(textoACentimos('0,29')).toBe(29);
    expect(textoACentimos('1,15')).toBe(115);
    expect(textoACentimos('35,57')).toBe(3557);
  });

  it('rechaza textos que no son importes', () => {
    for (const texto of ['', 'abc', '-5', '25,555', '1.000,50', '25,', ',5', '1e3']) {
      expect(textoACentimos(texto)).toBeNull();
    }
  });
});

describe('fechas', () => {
  it('genera la fecha local en formato AAAA-MM-DD', () => {
    expect(fechaDeHoy(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('interpreta la fecha sin desplazarla por la zona horaria', () => {
    const fecha = parsearFecha('2026-11-01');
    expect([fecha.getFullYear(), fecha.getMonth(), fecha.getDate()]).toEqual([2026, 10, 1]);
  });
});

describe('ordenarPorFecha', () => {
  it('ordena del más reciente al más antiguo y, a igual fecha, por orden de registro', () => {
    const partidos = [
      { id: 'a', fecha: '2026-10-01', creadoEn: 1 },
      { id: 'b', fecha: '2026-11-01', creadoEn: 2 },
      { id: 'c', fecha: '2026-10-01', creadoEn: 3 },
    ];
    expect(ordenarPorFecha(partidos).map((p) => p.id)).toEqual(['b', 'c', 'a']);
    // No modifica la lista original
    expect(partidos[0].id).toBe('a');
  });

  it('a igual fecha ordena por hora, de la más tardía a la más temprana', () => {
    const partidos = [
      { id: 'diez', fecha: '2026-11-14', hora: '10:00', creadoEn: 3 },
      { id: 'once', fecha: '2026-11-14', hora: '11:00', creadoEn: 1 },
      { id: 'sin-hora', fecha: '2026-11-14', creadoEn: 2 },
    ];
    expect(ordenarPorFecha(partidos).map((p) => p.id)).toEqual(['once', 'diez', 'sin-hora']);
  });
});

describe('textoPartidos', () => {
  it('usa singular y plural', () => {
    expect(textoPartidos(1)).toBe('1 partido');
    expect(textoPartidos(0)).toBe('0 partidos');
    expect(textoPartidos(3)).toBe('3 partidos');
  });
});

describe('validarFormulario', async () => {
  const { validarFormulario } = await import('../components/FormularioPartido.jsx');
  const valores = { fecha: '2026-11-14', hora: '', local: 'A', visitante: 'B', categoria: 'Senior', importe: '20', estado: 'pendiente' };

  it('la hora es opcional', () => {
    expect(validarFormulario(valores).errores).toEqual({});
    expect(validarFormulario({ ...valores, hora: '10:00' }).errores).toEqual({});
  });

  it('rechaza una hora mal escrita', () => {
    expect(validarFormulario({ ...valores, hora: '10' }).errores).toEqual({ hora: 'Hora no válida' });
  });
});
