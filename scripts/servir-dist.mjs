// Sirve la carpeta dist/ con las mismas cabeceras que define vercel.json (incluida la CSP),
// para probar la versión compilada en local tal y como funcionará publicada.
// Uso: npm run probar   (o node scripts/servir-dist.mjs tras npm run build)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
const carpeta = join(raiz, 'dist');
const puerto = Number(process.env.PORT) || 4173;
const config = JSON.parse(await readFile(join(raiz, 'vercel.json'), 'utf8'));

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Convierte los patrones de vercel.json usados en este proyecto ("/(.*)", "/assets/(.*)", "/sw.js")
function coincide(patron, ruta) {
  // Primero se separa el comodín "(.*)" y después se escapan los puntos literales (como en ".mjs")
  const regex = new RegExp('^' + patron.split('(.*)').map((parte) => parte.replace(/[.]/g, '\\.')).join('.*') + '$');
  return regex.test(ruta);
}

function ponerCabeceras(respuesta, ruta) {
  for (const regla of config.headers) {
    if (coincide(regla.source, ruta)) {
      for (const { key, value } of regla.headers) respuesta.setHeader(key, value);
    }
  }
}

async function existeArchivo(archivo) {
  try {
    return (await stat(archivo)).isFile();
  } catch {
    return false;
  }
}

createServer(async (peticion, respuesta) => {
  const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);

  // Como "rewrites" de Vercel: /legal sirve legal.html sin cambiar la dirección
  const reescritura = (config.rewrites || []).find((r) => r.source === ruta);
  const destino = reescritura ? reescritura.destination : ruta;

  const archivo = normalize(join(carpeta, destino === '/' ? 'index.html' : destino));
  if (!archivo.startsWith(carpeta)) {
    respuesta.writeHead(403).end();
    return;
  }

  ponerCabeceras(respuesta, ruta);
  if (await existeArchivo(archivo)) {
    respuesta.setHeader('Content-Type', TIPOS[extname(archivo)] || 'application/octet-stream');
    respuesta.writeHead(200).end(await readFile(archivo));
    return;
  }

  // Como Vercel: si existe 404.html se muestra con el código 404
  const pagina404 = join(carpeta, '404.html');
  if (await existeArchivo(pagina404)) {
    respuesta.writeHead(404, { 'Content-Type': TIPOS['.html'] }).end(await readFile(pagina404));
  } else {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
}).listen(puerto, '127.0.0.1', () => {
  console.log(`Sirviendo dist/ con las cabeceras de vercel.json en http://localhost:${puerto}`);
});
