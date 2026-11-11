// Comprueba las reglas de seguridad de firestore.rules contra el emulador de Firestore.
// Se ejecutan con: npm run test:reglas
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';

let entorno;

const PARTIDO = {
  fecha: '2026-11-14',
  hora: '12:00',
  local: 'C.D. CANTORIA 2017 F.C.',
  visitante: 'CLUB NATACION ALMERIA',
  categoria: '3ª Andaluza Alevín',
  importeCentimos: 2032,
  estado: 'pendiente',
  creadoEn: 1763100000000,
  campo: 'Campo Municipal',
  designacion: '2009504',
};

beforeAll(async () => {
  entorno = await initializeTestEnvironment({
    projectId: 'demo-mis-arbitrajes',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

beforeEach(async () => {
  await entorno.clearFirestore();
});

afterAll(async () => {
  await entorno?.cleanup();
});

const dbDe = (uid) => entorno.authenticatedContext(uid).firestore();
const partidoDe = (db, uid, id = 'p1') => doc(db, 'usuarios', uid, 'partidos', id);

describe('acceso a los partidos', () => {
  it('cada usuario puede crear, leer, editar y borrar sus partidos', async () => {
    const db = dbDe('ana');
    await assertSucceeds(setDoc(partidoDe(db, 'ana'), PARTIDO));
    await assertSucceeds(getDoc(partidoDe(db, 'ana')));
    await assertSucceeds(getDocs(collection(db, 'usuarios', 'ana', 'partidos')));
    await assertSucceeds(updateDoc(partidoDe(db, 'ana'), { estado: 'cobrado' }));
    await assertSucceeds(deleteDoc(partidoDe(db, 'ana')));
  });

  it('nadie puede leer ni tocar los partidos de otro usuario', async () => {
    await entorno.withSecurityRulesDisabled((contexto) => setDoc(partidoDe(contexto.firestore(), 'ana'), PARTIDO));
    const intruso = dbDe('beto');
    await assertFails(getDoc(partidoDe(intruso, 'ana')));
    await assertFails(getDocs(collection(intruso, 'usuarios', 'ana', 'partidos')));
    await assertFails(setDoc(partidoDe(intruso, 'ana', 'p2'), PARTIDO));
    await assertFails(updateDoc(partidoDe(intruso, 'ana'), { estado: 'cobrado' }));
    await assertFails(deleteDoc(partidoDe(intruso, 'ana')));
  });

  it('sin sesión no se puede leer ni escribir nada', async () => {
    const anonimo = entorno.unauthenticatedContext().firestore();
    await assertFails(getDoc(partidoDe(anonimo, 'ana')));
    await assertFails(setDoc(partidoDe(anonimo, 'ana'), PARTIDO));
  });

  it('no se puede escribir fuera de la colección de partidos', async () => {
    const db = dbDe('ana');
    await assertFails(setDoc(doc(db, 'usuarios', 'ana'), { nombre: 'Ana' }));
    await assertFails(setDoc(doc(db, 'otra', 'cosa'), { a: 1 }));
    await assertFails(getDocs(collection(db, 'usuarios')));
  });
});

describe('validación de los datos', () => {
  const sinCampo = (campo) => {
    const copia = { ...PARTIDO };
    delete copia[campo];
    return copia;
  };

  it('acepta partidos sin los campos opcionales', async () => {
    const minimo = sinCampo('hora');
    delete minimo.campo;
    delete minimo.designacion;
    await assertSucceeds(setDoc(partidoDe(dbDe('ana'), 'ana'), minimo));
  });

  it('rechaza partidos incompletos o con campos de más', async () => {
    const db = dbDe('ana');
    for (const campo of ['fecha', 'local', 'visitante', 'categoria', 'importeCentimos', 'estado', 'creadoEn']) {
      await assertFails(setDoc(partidoDe(db, 'ana'), sinCampo(campo)));
    }
    await assertFails(setDoc(partidoDe(db, 'ana'), { ...PARTIDO, esAdmin: true }));
  });

  it('rechaza valores con formato incorrecto', async () => {
    const db = dbDe('ana');
    const malos = [
      { fecha: '14/11/2026' },
      { hora: '12h' },
      { importeCentimos: 20.32 },
      { importeCentimos: -100 },
      { importeCentimos: 100000001 },
      { importeCentimos: '2032' },
      { estado: 'regalado' },
      { local: '' },
      { local: 'x'.repeat(201) },
      { designacion: 'abc' },
      { creadoEn: 'ayer' },
    ];
    for (const cambio of malos) {
      await assertFails(setDoc(partidoDe(db, 'ana'), { ...PARTIDO, ...cambio }));
    }
  });

  it('impide dejar un partido inválido al editarlo', async () => {
    const db = dbDe('ana');
    await assertSucceeds(setDoc(partidoDe(db, 'ana'), PARTIDO));
    await assertFails(updateDoc(partidoDe(db, 'ana'), { estado: 'otro' }));
    await assertFails(updateDoc(partidoDe(db, 'ana'), { extra: 1 }));
  });
});
