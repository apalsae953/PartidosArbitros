import { describe, expect, it } from 'vitest';
import { calcularCambios, datosDocumento, dividirEnLotes } from './cambios.js';

const a = { id: 'a', fecha: '2026-11-01', local: 'A', visitante: 'B', categoria: 'Senior', importeCentimos: 3000, estado: 'pendiente', creadoEn: 1 };
const b = { ...a, id: 'b' };

describe('calcularCambios', () => {
  it('detecta altas, modificaciones y bajas', () => {
    const c = { ...a, id: 'c' };
    const aCobrado = { ...a, estado: 'cobrado' };
    expect(calcularCambios([a, b], [aCobrado, c])).toEqual({ guardar: [aCobrado, c], eliminar: ['b'] });
  });

  it('no escribe nada si no hay cambios', () => {
    expect(calcularCambios([a, b], [{ ...a }, { ...b }])).toEqual({ guardar: [], eliminar: [] });
  });

  it('detecta campos opcionales añadidos o quitados', () => {
    const conHora = { ...a, hora: '12:00' };
    expect(calcularCambios([a], [conHora]).guardar).toEqual([conHora]);
    expect(calcularCambios([conHora], [a]).guardar).toEqual([a]);
  });
});

describe('utilidades', () => {
  it('quita el id de los datos del documento', () => {
    expect(datosDocumento(a)).not.toHaveProperty('id');
    expect(datosDocumento(a).local).toBe('A');
  });

  it('divide las operaciones en lotes', () => {
    const lotes = dividirEnLotes(Array.from({ length: 900 }, (_, i) => i));
    expect(lotes.map((l) => l.length)).toEqual([400, 400, 100]);
    expect(dividirEnLotes([])).toEqual([]);
  });
});
