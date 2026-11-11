// Configuración del proyecto de Firebase (cuentas y base de datos en la nube).
// Estos datos NO son secretos: solo identifican el proyecto. Lo que protege los datos de cada usuario
// son las reglas de seguridad de firestore.rules.
// Mientras estén vacíos, la app funciona solo con los datos del dispositivo (sin cuentas).
export const CONFIG_FIREBASE = {
  apiKey: 'AIzaSyCma_yLNZi9s_uhklPJAdOS6cmNRCdKaUc',
  authDomain: 'partidosarbitros.firebaseapp.com',
  projectId: 'partidosarbitros',
  storageBucket: 'partidosarbitros.firebasestorage.app',
  messagingSenderId: '1050511291407',
  appId: '1:1050511291407:web:0a23c6efdecb92c3809f7a',
};

// Con VITE_EMULADORES=1 (npm run dev:emuladores) la app usa los emuladores locales de Firebase,
// para probar cuentas y sincronización sin tocar el proyecto real
export const USAR_EMULADORES = import.meta.env.VITE_EMULADORES === '1';

export const CONFIG_EMULADORES = {
  apiKey: 'demo-clave',
  authDomain: 'demo-mis-arbitrajes.firebaseapp.com',
  projectId: 'demo-mis-arbitrajes',
  appId: 'demo-app',
};

export const CUENTAS_DISPONIBLES = USAR_EMULADORES || Boolean(CONFIG_FIREBASE.apiKey);
