# Mis Arbitrajes

Aplicación web (PWA) para que un árbitro lleve el control de sus partidos y de lo que ha cobrado y le queda por cobrar.
Funciona sin conexión, se puede instalar en el móvil y **no envía datos a ningún servidor**: todo se guarda en el
dispositivo de cada usuario.

## Funciones

- **Temporadas** (de julio a junio) con selector en la cabecera y vista de todo el histórico.
- **Resumen** de lo generado, cobrado y pendiente, con la media por partido.
- **Gráfico de ingresos por mes**: al tocar un mes, la lista muestra solo sus partidos.
- **Lista agrupada por meses** con búsqueda (sin importar tildes) y filtro por estado de cobro.
- **Añadir y editar** en una ventana (hoja inferior en el móvil). Al elegir categoría se propone el importe del último
  partido de esa categoría, y «Guardar y otro» deja el formulario listo para el siguiente.
- **Importar desde el PDF de designación de la RFAF**: lee fecha, hora, equipos, competición, campo, número de
  designación e importe total de tu liquidación (arbitraje + manutención + kilometraje). Admite varios PDF a la vez
  (botón «Importar PDF», dentro de «Nuevo partido» o arrastrándolos a la página), muestra una vista previa y avisa si
  un partido ya está registrado. El PDF se lee en el propio navegador con pdf.js y no se envía a ningún sitio.
- **Cobrar con un toque** desde la lista y **eliminar con opción de deshacer**.
- **Copias de seguridad** (.json para restaurar, .csv para Excel) con recordatorio si llevas tiempo sin hacer una.

## Requisitos

- [Node.js](https://nodejs.org) 20.19 o superior.

## Comandos

```bash
npm install        # instala las dependencias (solo la primera vez)
npm run dev        # servidor de desarrollo en http://localhost:5173
npm test           # ejecuta los tests
npm run build      # genera la versión para publicar en dist/
npm run probar     # compila y sirve dist/ en http://localhost:4173 con las mismas cabeceras que Vercel
```

## Antes de publicar

1. **Rellena tus datos** en [`src/config/titular.js`](src/config/titular.js): nombre, correo de contacto y, cuando la
   tengas, la dirección de la web. Aparecen en el aviso legal y la política de privacidad. Mientras falten,
   `npm run build` muestra un aviso.
2. **Revisa los textos legales** en [`src/legal/PaginaLegal.jsx`](src/legal/PaginaLegal.jsx) y cambia
   `FECHA_TEXTOS_LEGALES` si los modificas. Están pensados para una herramienta gratuita y sin ánimo de lucro; si
   algún día cobras, pones anuncios o añades analítica, tendrás que actualizarlos (y probablemente añadir un banner de
   cookies).
3. Ejecuta `npm test` y `npm run probar`, y prueba la app en el navegador.

## Publicar en Vercel

La configuración ya está en [`vercel.json`](vercel.json): Vercel detecta Vite, compila con `npm run build`, publica
`dist/` y añade cabeceras de seguridad (CSP, HSTS, anti-iframe…).

**Opción A: desde GitHub (recomendada, se actualiza sola con cada cambio)**

1. Sube el proyecto a un repositorio de GitHub (la carpeta `node_modules` y `dist` ya están excluidas en `.gitignore`).
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio y pulsa *Deploy*. No hace falta cambiar nada.

**Opción B: desde la terminal**

```bash
npm install -g vercel
vercel          # primera vez: crea el proyecto y publica una versión de prueba
vercel --prod   # publica en la dirección definitiva
```

> El plan gratuito de Vercel (Hobby) es solo para **uso personal y no comercial**. Si algún día cobras por la app,
> cambia a un plan de pago o a otro alojamiento.

## Después de publicar

- Abre la web en un **Android y un iPhone reales**: instala la app, añade partidos, ciérrala, ábrela en modo avión,
  exporta una copia e impórtala.
- Pasa la auditoría **Lighthouse** de Chrome (DevTools > Lighthouse) sobre la dirección publicada.
- En las versiones de prueba (*preview*) de Vercel puede aparecer un error de consola por su barra de comentarios: la
  CSP la bloquea a propósito. En la versión de producción no aparece.

## Actualizaciones

Cada vez que publiques cambios, los usuarios verán el aviso «Hay una versión nueva de la app» con un botón para
actualizar. No hay que cambiar ningún número de versión a mano: lo gestiona `vite-plugin-pwa`.

**No cambies las claves de `localStorage`** de [`src/lib/constantes.js`](src/lib/constantes.js): los usuarios
dejarían de ver sus datos.

## Cómo protege los datos y la privacidad

- Sin cuenta, todo se guarda en el `localStorage` del usuario. Con cuenta, en Firestore (Madrid) con reglas que
  impiden ver o tocar datos ajenos.
- **App Check** (reCAPTCHA Enterprise) comprueba que las peticiones a Firebase vienen de esta web. Solo se carga
  cuando se usan las cuentas: quien usa la app sin cuenta no hace ninguna petición a Google.
- **Vercel Web Analytics** cuenta visitas sin cookies ni identificadores (se activa en el panel de Vercel, pestaña
  *Analytics*).
- La fuente, los iconos y las librerías se sirven desde la propia web: no hay peticiones a CDNs.
- Avisa de que borrar los datos del navegador borra los partidos y, en iPhone, explica que Safari borra los datos de
  las webs que no se abren en 7 días si no están en la pantalla de inicio.
- Recuerda exportar una copia si nunca se ha hecho o si han pasado 30 días desde la última.
- Pide al navegador almacenamiento persistente y avisa si no se pueden guardar los cambios.
- Valida los archivos importados y descarta registros incorrectos o campos desconocidos.
- El CSV protege contra fórmulas maliciosas al abrirlo en Excel.

## Estructura

```
index.html, legal.html     Páginas de entrada (la app y la información legal)
404.html                   Página de error para direcciones que no existen
public/icons/              Iconos de la app, imagen para compartir (y sus SVG originales)
public/licencias/          Licencias que exigen copia completa (Inter, PDF.js)
public/robots.txt, sitemap.xml   Indicaciones para buscadores
src/App.jsx                Composición de la app y gestión de los datos
src/components/            Componentes de la interfaz
src/hooks/                 Sesión, partidos (dispositivo o nube) e instalación como app
src/lib/                   Lógica sin interfaz: formatos, almacenamiento, copias, PDF, temporadas
src/lib/nube/              Conexión con Firebase (cuentas, base de datos, App Check)
src/legal/                 Página de aviso legal, privacidad, cookies y licencias
src/config/                Tus datos para los textos legales y la configuración de Firebase
pruebas/                   Tests de las reglas de seguridad (con emulador)
scripts/servir-dist.mjs    Servidor local que imita a Vercel (cabeceras, reescrituras, 404)
```

## Buscadores, dominio y mantenimiento

- **URLs limpias**: `/legal` sirve `legal.html` mediante una reescritura en `vercel.json`. No se usa `cleanUrls` porque
  redirige los `.html` y eso impide al service worker guardar las páginas para usarlas sin conexión.
- **Vista previa al compartir**: etiquetas Open Graph y `public/icons/compartir.jpg`.
- **Si cambias de dominio**, actualiza la URL en `index.html`, `legal.html`, `public/robots.txt`,
  `public/sitemap.xml`, `src/config/titular.js`, los dominios autorizados de Firebase Authentication y los de la
  clave de reCAPTCHA.
- **Pendiente de hacer a mano** (requiere tu cuenta): alta en Google Search Console y Bing Webmaster Tools (enviando
  `sitemap.xml`), y un aviso de caída gratuito (por ejemplo, UptimeRobot) sobre la dirección publicada.

## Cuentas y nube (Firebase)

La app funciona sin cuenta (datos solo en el dispositivo) o con cuenta (datos en Cloud Firestore, sincronizados entre
dispositivos y disponibles sin conexión). Las cuentas usan Firebase Authentication con correo y contraseña o Google.

- **Configuración**: [`src/config/firebase.js`](src/config/firebase.js). Si está vacía, la app no muestra cuentas.
  Estos datos no son secretos; lo que protege la información son las reglas.
- **Reglas de seguridad**: [`firestore.rules`](firestore.rules). Cada usuario solo puede leer y escribir
  `usuarios/{su-id}/partidos/*`, y solo con datos válidos.
- **Proyecto**: [`firebase.json`](firebase.json) y `.firebaserc`. Para publicar cambios en las reglas o en los métodos
  de acceso: `npm run desplegar:firebase` (requiere `npx firebase login`).

### Probar en local con los emuladores

No toca el proyecto real ni crea cuentas de verdad. Requiere Java 11 o superior.

```bash
npm run emuladores        # emuladores de cuentas y base de datos (panel en http://localhost:4000)
npm run dev:emuladores    # la app conectada a los emuladores
npm run test:reglas       # tests de las reglas de seguridad
```

En los emuladores sirve cualquier correo inventado (por ejemplo `prueba@ejemplo.test`) y la contraseña que quieras.
En Windows, si al terminar `npm run test:reglas` el puerto 8080 queda ocupado por un proceso `java`, ciérralo desde el
Administrador de tareas antes de volver a lanzar los emuladores.

## Lector de PDF

El lector de designaciones está en [`src/lib/designacionRfaf.js`](src/lib/designacionRfaf.js) y sus tests en
[`src/lib/designacionRfaf.test.js`](src/lib/designacionRfaf.test.js). Si la RFAF cambia el formato del PDF y deja de
leerse bien, ahí es donde hay que ajustarlo. Los tests usan textos con nombres inventados: no guardes PDF reales en el
repositorio, porque contienen nombres y teléfonos de otras personas.

pdf.js (unos 1,8 MB) no se descarga al instalar la app, sino la primera vez que se importa un PDF; a partir de ahí
queda guardado y funciona sin conexión.

## Nota sobre `npm audit`

`npm audit` muestra avisos moderados en `workbox-build` y sus dependencias (`glob`, `minimatch`, `deepmerge`). Son
herramientas que solo se usan **al compilar** en tu ordenador o en Vercel; no forman parte de la web que descargan
los usuarios. No uses `npm audit fix --force`: bajaría `vite-plugin-pwa` a una versión incompatible. Basta con
actualizar las dependencias de vez en cuando (`npm update`).
