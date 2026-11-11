// Claves de localStorage (no cambiarlas: los datos ya guardados dejarían de encontrarse)
export const CLAVE_PARTIDOS = 'arbitro.partidos.v1';
export const CLAVE_AVISO_CERRADO = 'arbitro.avisoDatos.cerrado';
export const CLAVE_ULTIMA_COPIA = 'arbitro.ultimaCopia';

// Días sin exportar a partir de los cuales se recuerda hacer una copia
export const DIAS_RECORDATORIO_COPIA = 30;

// Sugerencias para el campo de categoría (se puede escribir cualquier otra)
export const CATEGORIAS = [
  'Prebenjamín',
  'Benjamín',
  'Alevín',
  'Infantil',
  'Cadete',
  'Juvenil',
  'Senior',
  'Veteranos',
];

export const ESTADOS = {
  PENDIENTE: 'pendiente',
  COBRADO: 'cobrado',
};

export const ETIQUETAS_ESTADO = {
  [ESTADOS.PENDIENTE]: 'Pendiente',
  [ESTADOS.COBRADO]: 'Cobrado',
};
