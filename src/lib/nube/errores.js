// Traduce los códigos de error de Firebase a mensajes comprensibles.
// null significa que no hay que mostrar nada (por ejemplo, si el usuario cierra la ventana de Google).
const CREDENCIALES_INCORRECTAS = 'El correo o la contraseña no son correctos.';

const MENSAJES = {
  'auth/invalid-credential': CREDENCIALES_INCORRECTAS,
  'auth/wrong-password': CREDENCIALES_INCORRECTAS,
  'auth/user-not-found': CREDENCIALES_INCORRECTAS,
  'auth/invalid-email': 'El correo no es válido.',
  'auth/missing-email': 'Escribe tu correo.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Prueba a entrar.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 8 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  'auth/network-request-failed': 'No hay conexión. Comprueba tu internet y vuelve a probar.',
  'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes y vuelve a probar.',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
  'auth/user-disabled': 'Esta cuenta está desactivada.',
  'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a entrar y repítelo.',
  'auth/user-mismatch': 'Has elegido una cuenta distinta a la tuya.',
  'auth/operation-not-allowed': 'Este método de acceso no está activado todavía.',
  'auth/unauthorized-domain': 'Esta web no está autorizada para iniciar sesión con Google.',
  'permission-denied': 'No se han podido guardar los datos (permiso denegado).',
  unavailable: 'No hay conexión con el servidor. Vuelve a probar en un momento.',
};

export function mensajeError(error) {
  const codigo = error?.code || '';
  if (codigo in MENSAJES) return MENSAJES[codigo];
  return 'Ha ocurrido un error inesperado. Vuelve a intentarlo.';
}
