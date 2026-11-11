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
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Convierte los patrones de vercel.json usados en este proyecto ("/(.*)", "/assets/(.*)", "/sw.js")
function coincide(patron, ruta) {
  const regex = new RegExp('^' + patron.replace(/[.]/g, '\\.').replace('(.*)', '.*') + '$');
  return regex.test(ruta);
}

createServer(async (peticion, respuesta) => {
  const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
  let archivo = normalize(join(carpeta, ruta === '/' ? 'index.html' : ruta));
  if (!archivo.startsWith(carpeta)) {
    respuesta.writeHead(403).end();
    return;
  }

  try {
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
    const contenido = await readFile(archivo);
    for (const regla of config.headers) {
      if (coincide(regla.source, ruta)) {
        for (const { key, value } of regla.headers) respuesta.setHeader(key, value);
      }
    }
    respuesta.setHeader('Content-Type', TIPOS[extname(archivo)] || 'application/octet-stream');
    respuesta.writeHead(200).end(contenido);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
}).listen(puerto, '127.0.0.1', () => {
  console.log(`Sirviendo dist/ con las cabeceras de vercel.json en http://localhost:${puerto}`);
});
