// Conexión con Firebase: cuentas (Authentication) y base de datos (Firestore).
// Este módulo se carga aparte (import dinámico) para no retrasar la primera carga de la app.
import { initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  clearIndexedDbPersistence,
  collection,
  connectFirestoreEmulator,
  doc,
  getDocsFromServer,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  writeBatch,
} from 'firebase/firestore';
import { CONFIG_EMULADORES, CONFIG_FIREBASE, USAR_EMULADORES } from '../../config/firebase.js';
import { esPartidoValido } from '../almacenamiento.js';
import { datosDocumento, dividirEnLotes } from './cambios.js';

const app = initializeApp(USAR_EMULADORES ? CONFIG_EMULADORES : CONFIG_FIREBASE);

// La sesión se recuerda en el dispositivo (también sin conexión)
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
auth.languageCode = 'es';

// Los partidos se guardan también en el dispositivo: la app funciona sin conexión
// y sincroniza los cambios en cuanto vuelve a haber red
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (USAR_EMULADORES) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

const coleccionPartidos = (uid) => collection(db, 'usuarios', uid, 'partidos');

// =========================================================================
// Cuentas
// =========================================================================

function datosUsuario(usuario) {
  return {
    uid: usuario.uid,
    email: usuario.email || '',
    nombre: usuario.displayName || '',
    conGoogle: usuario.providerData.some((p) => p.providerId === 'google.com'),
    conContrasena: usuario.providerData.some((p) => p.providerId === 'password'),
  };
}

export function observarSesion(alCambiar) {
  return onAuthStateChanged(auth, (usuario) => alCambiar(usuario ? datosUsuario(usuario) : null));
}

export async function entrarConCorreo(email, contrasena) {
  await signInWithEmailAndPassword(auth, email, contrasena);
}

export async function crearCuenta(email, contrasena) {
  await createUserWithEmailAndPassword(auth, email, contrasena);
}

export async function entrarConGoogle() {
  const proveedor = new GoogleAuthProvider();
  proveedor.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, proveedor);
}

export async function recuperarContrasena(email) {
  await sendPasswordResetEmail(auth, email);
}

// Al salir se borra también la copia local de la base de datos, para no dejar datos en un dispositivo compartido
export async function cerrarSesion() {
  await signOut(auth);
  await borrarCacheLocal();
}

async function borrarCacheLocal() {
  await terminate(db);
  try {
    await clearIndexedDbPersistence(db);
  } catch (error) {
    console.warn('No se pudo borrar la copia local de la base de datos', error);
  }
}

// Borra todos los partidos de la nube y la cuenta. Por seguridad, Firebase exige confirmar la identidad antes.
export async function eliminarCuenta({ contrasena } = {}) {
  const usuario = auth.currentUser;
  if (!usuario) return;

  if (usuario.providerData.some((p) => p.providerId === 'password')) {
    await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email, contrasena || ''));
  } else {
    await reauthenticateWithPopup(usuario, new GoogleAuthProvider());
  }

  // Se leen del servidor para no dejar ninguno atrás (requiere conexión)
  const documentos = await getDocsFromServer(coleccionPartidos(usuario.uid));
  for (const lote of dividirEnLotes(documentos.docs)) {
    const escritura = writeBatch(db);
    lote.forEach((documento) => escritura.delete(documento.ref));
    await escritura.commit();
  }

  await deleteUser(usuario);
  await borrarCacheLocal();
}

// =========================================================================
// Partidos
// =========================================================================

// Avisa de cada cambio en los partidos del usuario (incluidos los que aún no se han subido)
export function observarPartidos(uid, alCambiar, alFallar) {
  return onSnapshot(
    coleccionPartidos(uid),
    { includeMetadataChanges: true },
    (instantanea) => {
      const partidos = instantanea.docs.map((d) => ({ id: d.id, ...d.data() })).filter(esPartidoValido);
      alCambiar(partidos, {
        pendientes: instantanea.metadata.hasPendingWrites,
        sinConexion: instantanea.metadata.fromCache,
      });
    },
    alFallar
  );
}

// Guarda y borra documentos en lotes. No se espera a que lleguen al servidor:
// Firestore los guarda en el dispositivo y los sube cuando hay conexión.
export function guardarCambios(uid, { guardar, eliminar }, alFallar) {
  const operaciones = [
    ...guardar.map((partido) => ({ tipo: 'guardar', partido })),
    ...eliminar.map((id) => ({ tipo: 'eliminar', id })),
  ];
  for (const lote of dividirEnLotes(operaciones)) {
    const escritura = writeBatch(db);
    for (const operacion of lote) {
      if (operacion.tipo === 'guardar') {
        escritura.set(doc(coleccionPartidos(uid), operacion.partido.id), datosDocumento(operacion.partido));
      } else {
        escritura.delete(doc(coleccionPartidos(uid), operacion.id));
      }
    }
    escritura.commit().catch(alFallar);
  }
}
