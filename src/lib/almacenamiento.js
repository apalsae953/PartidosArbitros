import { CLAVE_AVISO_CERRADO, CLAVE_PARTIDOS, CLAVE_ULTIMA_COPIA, ESTADOS } from './constantes.js';

// Límite generoso para los textos: evita que un archivo importado meta datos desproporcionados
const MAX_LONGITUD_TEXTO = 200;

function esTextoValido(valor) {
  return typeof valor === 'string' && valor.length > 0 && valor.length <= MAX_LONGITUD_TEXTO;
}

// Campos opcionales: solo los tienen los partidos importados desde un PDF de designación
export const CAMPOS_OPCIONALES = {
  hora: /^\d{2}:\d{2}$/,
  campo: null,
  designacion: /^\d{1,20}$/,
};

function esOpcionalValido(valor, patron) {
  return valor === undefined || (esTextoValido(valor) && (!patron || patron.test(valor)));
}

export function esPartidoValido(partido) {
  return Boolean(
    partido &&
      esTextoValido(partido.id) &&
      /^\d{4}-\d{2}-\d{2}$/.test(partido.fecha) &&
      esTextoValido(partido.local) &&
      esTextoValido(partido.visitante) &&
      esTextoValido(partido.categoria) &&
      Number.isInteger(partido.importeCentimos) &&
      partido.importeCentimos >= 0 &&
      Object.values(ESTADOS).includes(partido.estado) &&
      Object.entries(CAMPOS_OPCIONALES).every(([campo, patron]) => esOpcionalValido(partido[campo], patron))
  );
}

// Quita los campos opcionales vacíos para no guardar textos en blanco
export function limpiarOpcionales(partido) {
  const limpio = { ...partido };
  for (const campo of Object.keys(CAMPOS_OPCIONALES)) {
    if (!limpio[campo]) delete limpio[campo];
  }
  return limpio;
}

// localStorage puede no existir o lanzar errores (modo privado, almacenamiento bloqueado...),
// por eso todos los accesos pasan por estas dos funciones
function leer(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch (error) {
    console.warn(`No se pudo guardar "${clave}"`, error);
    return false;
  }
}

export function cargarPartidos() {
  const guardado = leer(CLAVE_PARTIDOS);
  if (!guardado) return [];
  try {
    const datos = JSON.parse(guardado);
    return Array.isArray(datos) ? datos.filter(esPartidoValido) : [];
  } catch (error) {
    console.warn('Los partidos guardados están dañados', error);
    return [];
  }
}

export function guardarPartidos(partidos) {
  return escribir(CLAVE_PARTIDOS, JSON.stringify(partidos));
}

export function avisoYaCerrado() {
  return leer(CLAVE_AVISO_CERRADO) === '1';
}

export function recordarAvisoCerrado() {
  escribir(CLAVE_AVISO_CERRADO, '1');
}

// Momento (en milisegundos) de la última copia de seguridad, o null si nunca se hizo
export function leerUltimaCopia() {
  const valor = Number(leer(CLAVE_ULTIMA_COPIA));
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

export function registrarCopia(momento = Date.now()) {
  escribir(CLAVE_ULTIMA_COPIA, String(momento));
}
