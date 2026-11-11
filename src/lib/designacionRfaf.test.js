import { describe, expect, it } from 'vitest';
import { interpretarDesignacion, separarEquipos } from './designacionRfaf.js';

// Textos con la misma forma que los extrae pdf.js de las designaciones reales.
// Los nombres y teléfonos del equipo arbitral son inventados.
const PIE =
  'Delegación: ALMERIA Designación Nº: {N} C/ Afán de Ribera 17-23 - 41006 Sevilla http://rfaf.es Tels.: 954 22 67 23 / 24 / 25 Fax: 954 21 77 91 COMITE TÉCNICO DE ÁRBITROS';

function designacion({ numero, fecha, hora, local, visitante, competicion, grupo, campo, ciudad, personal = '', liquidacion }) {
  return (
    `Designación de ARBITRO Con fecha ${fecha} a las ${hora} , GARCIA LOPEZ, JUAN actuará como ARBITRO entre los equipos ${local} y ${visitante} ` +
    `de la ${competicion} , grupo ${grupo} . El partido tendrá lugar en el campo ${campo} de ${ciudad} . ` +
    `Personal designado actuará como: ${personal} Liquidación Euros ${liquidacion} ` +
    PIE.replace('{N}', numero)
  );
}

function recibo(club, ciudad, local, visitante, numero) {
  return `Recibo Pendiente por recibir de manera telemática del club ${club} de ${ciudad} la cantidad de 23,00 por el partido entre los equipos ${local} y ${visitante} referente a la competición ... ${PIE.replace('{N}', numero)}`;
}

const ALEVIN = [
  designacion({
    numero: '2009504',
    fecha: '14-11-2026',
    hora: '12:00',
    local: 'C.D. CANTORIA 2017 F.C.',
    visitante: 'CLUB NATACION ALMERIA',
    competicion: '3ª Andaluza Alevín (Almería)',
    grupo: 'Grupo Dos',
    campo: 'Cantoria - CAMPO MUNICIPAL LOS OLIVOS (F-11, F-7)',
    ciudad: 'Cantoria',
    liquidacion: 'Importe arbitraje 14,86 Gastos por manutención 0,00 Kilometraje 5,46 Total 20,32',
  }),
  recibo('C.D. CANTORIA 2017 F.C.', 'Cantoria', 'C.D. CANTORIA 2017 F.C.', 'CLUB NATACION ALMERIA', '2009504'),
];

const CADETE_CON_ASISTENTES = [
  designacion({
    numero: '2002159',
    fecha: '07-11-2026',
    hora: '18:00',
    local: 'C.D. VILLA DE ALBOX',
    visitante: 'U.C.D. LA CAÑADA AT',
    competicion: '2ª Andaluza Cadete (Almería)',
    grupo: 'Grupo Unico',
    campo: 'Albox - CAMPO MUNICIPAL LAS VENTAS (F-11,F-7)',
    ciudad: 'Albox',
    personal: 'ASISTENTE : PEREZ RUIZ, ANA Telefonos: 600000001 ASISTENTE : SANZ GIL , LUIS Telefonos: 600000002',
    liquidacion: 'Importe arbitraje 25,16 Gastos por manutención 0,00 Kilometraje 4,50 Total 29,66',
  }),
  recibo('C.D. VILLA DE ALBOX', 'Albox', 'C.D. VILLA DE ALBOX', 'U.C.D. LA CAÑADA AT', '2002159'),
  recibo('U.C.D. LA CAÑADA ATLETICO', 'Almería', 'C.D. VILLA DE ALBOX', 'U.C.D. LA CAÑADA AT', '2002159'),
];

describe('interpretarDesignacion', () => {
  it('lee fecha, hora, equipos, categoría, campo, número e importe total', () => {
    const resultado = interpretarDesignacion(ALEVIN);
    expect(resultado.ok).toBe(true);
    expect(resultado.partido).toEqual({
      fecha: '2026-11-14',
      hora: '12:00',
      local: 'C.D. CANTORIA 2017 F.C.',
      visitante: 'CLUB NATACION ALMERIA',
      categoria: '3ª Andaluza Alevín',
      importeCentimos: 2032,
      campo: 'Cantoria - CAMPO MUNICIPAL LOS OLIVOS (F-11, F-7)',
      designacion: '2009504',
    });
    expect(resultado.desglose).toEqual({ arbitraje: 1486, manutencion: 0, kilometraje: 546, total: 2032 });
    expect(resultado.avisos).toEqual([]);
  });

  it('funciona con asistentes en la designación y no guarda sus datos', () => {
    const resultado = interpretarDesignacion(CADETE_CON_ASISTENTES);
    expect(resultado.ok).toBe(true);
    expect(resultado.partido.local).toBe('C.D. VILLA DE ALBOX');
    expect(resultado.partido.visitante).toBe('U.C.D. LA CAÑADA AT');
    expect(resultado.partido.categoria).toBe('2ª Andaluza Cadete');
    expect(resultado.partido.importeCentimos).toBe(2966);
    expect(JSON.stringify(resultado)).not.toMatch(/PEREZ|600000001|GARCIA/);
  });

  it('incluye la manutención en el total', () => {
    const resultado = interpretarDesignacion([
      designacion({
        numero: '2010100',
        fecha: '15-11-2026',
        hora: '16:30',
        local: 'C.D. VERA',
        visitante: 'CARBONERAS C.F.',
        competicion: '3ª Andaluza Juvenil (Almería)',
        grupo: 'Grupo Tres',
        campo: 'Vera - CAMPO LAS VIÑAS (F-11, F-7)',
        ciudad: 'Vera',
        liquidacion: 'Importe arbitraje 28,25 Gastos por manutención 3,75 Kilometraje 19,24 Total 51,24',
      }),
    ]);
    expect(resultado.partido.importeCentimos).toBe(5124);
    expect(resultado.partido.hora).toBe('16:30');
  });

  it('avisa si en la designación no actúas como árbitro', () => {
    const texto = ALEVIN[0].replace('actuará como ARBITRO', 'actuará como ASISTENTE');
    expect(interpretarDesignacion([texto]).avisos[0]).toMatch(/asistente/);
  });

  it('avisa si el total no cuadra con los conceptos', () => {
    const texto = ALEVIN[0].replace('Total 20,32', 'Total 25,00');
    const resultado = interpretarDesignacion([texto]);
    expect(resultado.partido.importeCentimos).toBe(2500);
    expect(resultado.avisos[0]).toMatch(/no coincide/);
  });

  it('lee torneos sin grupo, con "Kilometrajes" y cobro en el campo', () => {
    // Formato de los torneos de escuelas (CEDIFA): sin grupo, sin delegación y con recibos "Recibí del club"
    const designacionTorneo =
      'USUARIO comite 1 Designación de ARBITRO Con fecha 14-11-2026 a las 11:00 , GARCIA LOPEZ, JUAN actuará como ARBITRO entre los equipos E.F. ' +
      'MACAEL y E.F. VERA de la TOR-ALE-F7-M-CEDIFA . El partido tendrá lugar en el campo Macael - CIUDAD DEPORTIVA DE MACAEL - CAMPO ANEXO - (F-11,F-7) ' +
      'de Macael . Personal designado actuará como: Liquidación Euros Importe arbitraje 11,50 Gastos por manutención 0,00 Kilometrajes 0,00 Total 11,50 ' +
      'Delegación: Designación Nº: 2012624 Firma, En a de 20';
    const reciboCampo = (club, ciudad) =>
      `Recibo Recibí del club ${club} de ${ciudad} la cantidad de 11,50 por el partido entre los equipos E.F. MACAEL y E.F. VERA referente a la competición de TOR-ALE-F7-M-CEDIFA . Designación Nº: 2012624`;
    const liquidacionClubes =
      'Liquidación D./Dª. GARCIA LOPEZ, JUAN , en función de ARBITRO del partido que enfrentan a los equipos E.F. MACAEL y E.F. VERA de la competición TOR-ALE-F7-M-CEDIFA , hace liquidación ' +
      'Liquidación E.F. MACAEL Euros Recibido del club 11,50 Importe arbitraje 5,75 Remanente 5,75 Total 5,75 ' +
      'Liquidación E.F. VERA Euros Recibido del club 11,50 Importe arbitraje 5,75 Remanente 5,75 Total 5,75';
    const impresoGastos =
      'LIQUIDACIÓN GASTOS PARTIDO Temporada 2026-2027 ARBITRO GARCIA LOPEZ, JUAN Partido Jugado en Macael el día 14.0 de de 2026 Entre los equipos E.F. MACAEL y E.F. VERA Total 0,00';

    const resultado = interpretarDesignacion([
      designacionTorneo,
      reciboCampo('E.F. MACAEL', 'MACAEL'),
      reciboCampo('E.F. VERA', 'VERA'),
      liquidacionClubes,
      impresoGastos,
    ]);
    expect(resultado.ok).toBe(true);
    expect(resultado.partido).toEqual({
      fecha: '2026-11-14',
      hora: '11:00',
      local: 'E.F. MACAEL',
      visitante: 'E.F. VERA',
      categoria: 'TOR-ALE-F7-M-CEDIFA',
      importeCentimos: 1150,
      campo: 'Macael - CIUDAD DEPORTIVA DE MACAEL - CAMPO ANEXO - (F-11,F-7)',
      designacion: '2012624',
    });
    expect(resultado.desglose).toEqual({ arbitraje: 1150, manutencion: 0, kilometraje: 0, total: 1150 });
    expect(resultado.avisos).toEqual([]);
    expect(resultado.notas).toEqual([
      'Cobro en el campo: los clubes te entregan 23,00 € y 11,50 € son para la delegación.',
    ]);
  });

  it('no añade nota de cobro en el campo cuando el pago es telemático', () => {
    expect(interpretarDesignacion(CADETE_CON_ASISTENTES).notas).toEqual([]);
  });

  it('rechaza PDF que no son designaciones', () => {
    expect(interpretarDesignacion(['Factura nº 123 Total 50,00'])).toEqual({
      ok: false,
      motivo: 'No parece un PDF de designación de la RFAF.',
    });
    expect(interpretarDesignacion(['']).ok).toBe(false);
  });
});

describe('separarEquipos', () => {
  it('separa por " y " cuando solo hay una opción', () => {
    expect(separarEquipos('C.D. VERA y CARBONERAS C.F.')).toEqual(['C.D. VERA', 'CARBONERAS C.F.']);
  });

  it('usa los nombres de los clubes cuando un equipo contiene " y "', () => {
    const clubes = ['c.d. ribera y montana', 'u.d. vega'];
    expect(separarEquipos('C.D. RIBERA y MONTAÑA y U.D. VEGA', clubes)).toEqual(['C.D. RIBERA y MONTAÑA', 'U.D. VEGA']);
  });

  it('devuelve null si no hay dos equipos', () => {
    expect(separarEquipos('C.D. VERA')).toBeNull();
  });
});
