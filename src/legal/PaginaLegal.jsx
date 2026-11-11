import { useEffect } from 'react';
import Icono from '../components/Icono.jsx';
import PieLegal from '../components/PieLegal.jsx';
import { FECHA_TEXTOS_LEGALES, TITULAR } from '../config/titular.js';
import { CLAVE_AVISO_CERRADO, CLAVE_PARTIDOS, CLAVE_ULTIMA_COPIA } from '../lib/constantes.js';

// Licencias de los componentes de terceros que se incluyen en la app publicada
const COMPONENTES_TERCEROS = [
  { nombre: 'React y React DOM', licencia: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.' },
  { nombre: 'Tailwind CSS', licencia: 'MIT', copyright: 'Copyright (c) Tailwind Labs, Inc.' },
  { nombre: 'Vite', licencia: 'MIT', copyright: 'Copyright (c) 2019-present, VoidZero Inc. and Vite contributors' },
  { nombre: 'vite-plugin-pwa', licencia: 'MIT', copyright: 'Copyright (c) 2020-PRESENT Anthony Fu' },
  { nombre: 'Workbox', licencia: 'MIT', copyright: 'Copyright 2018 Google LLC' },
  {
    nombre: 'Iconos Lucide',
    licencia: 'ISC',
    copyright:
      'Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.',
  },
  {
    nombre: 'Fuente Inter',
    licencia: 'SIL Open Font License 1.1',
    copyright: 'Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)',
  },
  {
    nombre: 'PDF.js (lector de PDF)',
    licencia: 'Apache 2.0',
    copyright: 'Copyright Mozilla Foundation and contributors (https://mozilla.github.io/pdf.js/)',
  },
];

const TEXTO_MIT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

const TEXTO_ISC = `Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;

function Seccion({ id, titulo, children }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700 [&_h3]:pt-2 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}

function EnlaceExterno({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 underline underline-offset-2">
      {children}
    </a>
  );
}

export default function PaginaLegal() {
  // Al abrir con un ancla (#privacidad, #cookies...) se desplaza a esa sección una vez pintada.
  // Se espera a la fuente porque al cargarse cambia la altura del texto y la posición de las secciones.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    document.fonts.ready.then(() => document.getElementById(id)?.scrollIntoView());
  }, []);

  const { nombre, email, localidad, nif, web } = TITULAR;
  const correo = <a href={`mailto:${email}`} className="font-medium text-emerald-700 underline underline-offset-2">{email}</a>;

  return (
    <>
      <header className="bg-slate-950">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-6 sm:px-6">
          <a
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Icono nombre="flechaIzquierda" className="h-4 w-4" />
            Volver a la app
          </a>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <h1 className="text-2xl font-semibold text-white">Información legal</h1>
          <p className="mt-1 text-sm text-slate-400">Última actualización: {FECHA_TEXTOS_LEGALES}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        <nav aria-label="Secciones" className="flex flex-wrap gap-2 text-sm">
          {[
            ['aviso-legal', 'Aviso legal'],
            ['privacidad', 'Privacidad'],
            ['cookies', 'Cookies'],
            ['licencias', 'Licencias'],
          ].map(([id, texto]) => (
            <a key={id} href={`#${id}`} className="rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              {texto}
            </a>
          ))}
        </nav>

        <Seccion id="aviso-legal" titulo="Aviso legal y condiciones de uso">
          <h3>Titular de la web</h3>
          <ul>
            <li>Titular: {nombre}</li>
            {nif && <li>NIF: {nif}</li>}
            {localidad && <li>Localidad: {localidad}</li>}
            <li>Contacto: {correo}</li>
            {web && <li>Web: {web}</li>}
          </ul>

          <h3>Qué es Mis Arbitrajes</h3>
          <p>
            Mis Arbitrajes es una herramienta gratuita para que los árbitros lleven un registro de sus partidos y de los
            importes cobrados y pendientes. No requiere registro ni cuenta de usuario.
          </p>

          <h3>Condiciones de uso</h3>
          <ul>
            <li>La herramienta se ofrece «tal cual», de forma gratuita y sin garantías de ningún tipo.</li>
            <li>
              Todos los datos se guardan únicamente en el dispositivo del usuario. El titular no tiene acceso a ellos y no
              puede recuperarlos si se pierden.
            </li>
            <li>
              El usuario es el único responsable de conservar sus datos y de hacer copias de seguridad con la opción
              «Exportar mis datos».
            </li>
            <li>
              Los importes y totales que muestra la app son orientativos y no sustituyen a ningún documento oficial ni a
              las obligaciones fiscales del usuario.
            </li>
          </ul>

          <h3>Responsabilidad</h3>
          <p>
            En la medida permitida por la ley, el titular no se hace responsable de la pérdida de datos causada por el
            borrado de los datos del navegador, fallos o cambios del dispositivo, desinstalación de la app, ni de errores
            en la información introducida por el usuario. El titular puede modificar, interrumpir o retirar la herramienta
            en cualquier momento.
          </p>

          <h3>Propiedad intelectual</h3>
          <p>
            El diseño y el código propio de la app pertenecen a su titular. Los componentes de terceros se usan conforme a
            sus licencias, detalladas en el apartado <a href="#licencias" className="font-medium text-emerald-700 underline underline-offset-2">Licencias</a>.
            Los nombres de equipos que introduce cada usuario son responsabilidad suya y no se publican en ningún sitio.
          </p>

          <h3>Legislación aplicable</h3>
          <p>Estas condiciones se rigen por la legislación española.</p>
        </Seccion>

        <Seccion id="privacidad" titulo="Política de privacidad">
          <h3>Resumen</h3>
          <p>
            <strong>Esta app no recoge, no envía y no almacena en ningún servidor los datos de tus partidos.</strong> Todo lo
            que registras se guarda solo en la memoria de tu navegador, en tu dispositivo, y únicamente tú tienes acceso.
          </p>

          <h3>Responsable</h3>
          <p>
            {nombre}. Contacto: {correo}.
          </p>

          <h3>Datos que se tratan</h3>
          <ul>
            <li>
              <strong>Datos de tus partidos</strong> (fecha, hora, equipos, categoría, campo, número de designación,
              importe y estado de cobro): se guardan solo en tu dispositivo. El titular no los recibe ni puede verlos.
            </li>
            <li>
              <strong>PDF de designación</strong>: si importas uno, se lee dentro de tu propio navegador y no se envía ni
              se guarda en ningún sitio. De él solo se conservan los datos del partido indicados arriba; el resto del
              contenido (como los nombres y teléfonos del equipo arbitral) se descarta.
            </li>
            <li>
              <strong>Archivos de copia de seguridad</strong>: los generas tú al pulsar «Exportar» y quedan bajo tu
              control. La app no los envía a ningún sitio.
            </li>
            <li>
              <strong>Datos técnicos de conexión</strong>: al visitar la web, el servicio de alojamiento registra
              automáticamente datos como la dirección IP, el navegador y la fecha de acceso, necesarios para servir la
              página y protegerla frente a abusos.
            </li>
          </ul>

          <h3>Alojamiento</h3>
          <p>
            La web está alojada en Vercel Inc. (Estados Unidos), que trata los datos técnicos de conexión como proveedor del
            servicio. La base legal es el interés legítimo en ofrecer la web de forma segura (art. 6.1.f del RGPD). Vercel
            ofrece garantías para las transferencias internacionales de datos, como las cláusulas contractuales tipo de la
            Comisión Europea. Más información en su{' '}
            <EnlaceExterno href="https://vercel.com/legal/privacy-policy">política de privacidad</EnlaceExterno>.
          </p>

          <h3>Lo que la app no hace</h3>
          <ul>
            <li>No usa analítica, publicidad ni herramientas de seguimiento.</li>
            <li>No carga fuentes, scripts ni recursos de servidores de terceros: todo se sirve desde la propia web.</li>
            <li>No pide registro, correo ni ningún dato personal para funcionar.</li>
          </ul>

          <h3>Tus derechos</h3>
          <p>
            Puedes borrar todos tus datos en cualquier momento eliminando los datos del sitio desde la configuración de tu
            navegador o desinstalando la app. Para cualquier consulta, o para ejercer tus derechos de acceso,
            rectificación, supresión, oposición, limitación y portabilidad, escribe a {correo}. Si consideras que no se han
            respetado tus derechos, puedes reclamar ante la{' '}
            <EnlaceExterno href="https://www.aepd.es">Agencia Española de Protección de Datos</EnlaceExterno>.
          </p>
        </Seccion>

        <Seccion id="cookies" titulo="Cookies y almacenamiento local">
          <p>
            <strong>Esta web no usa cookies</strong>, ni propias ni de terceros. Para funcionar, guarda en tu navegador
            (almacenamiento local o <em>localStorage</em>) solo lo imprescindible:
          </p>
          <ul>
            <li>
              <code className="rounded bg-slate-100 px-1">{CLAVE_PARTIDOS}</code>: tus partidos.
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1">{CLAVE_AVISO_CERRADO}</code>: si ya has cerrado el aviso sobre
              tus datos.
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1">{CLAVE_ULTIMA_COPIA}</code>: la fecha de tu última copia de
              seguridad, para recordártela.
            </li>
          </ul>
          <p>
            Además, guarda una copia de los archivos de la app (service worker) para que funcione sin conexión. Todo esto
            es estrictamente necesario para prestar el servicio que solicitas, por lo que no requiere consentimiento
            (art. 22.2 de la Ley 34/2002, LSSI). Nada de esta información sale de tu dispositivo.
          </p>
          <p>Puedes eliminarlo en cualquier momento borrando los datos del sitio en tu navegador. Si lo haces, perderás los partidos que no hayas exportado.</p>
        </Seccion>

        <Seccion id="licencias" titulo="Licencias de terceros">
          <p>La app incluye estos componentes de código abierto, que se usan conforme a sus licencias:</p>
          <ul>
            {COMPONENTES_TERCEROS.map((componente) => (
              <li key={componente.nombre}>
                <strong>{componente.nombre}</strong> ({componente.licencia}). {componente.copyright}
              </li>
            ))}
          </ul>

          <details className="rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
            <summary className="cursor-pointer font-medium text-slate-900">Texto de la licencia MIT</summary>
            <p className="mt-3 whitespace-pre-line text-xs text-slate-600">{TEXTO_MIT}</p>
          </details>
          <details className="rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
            <summary className="cursor-pointer font-medium text-slate-900">Texto de la licencia ISC</summary>
            <p className="mt-3 whitespace-pre-line text-xs text-slate-600">{TEXTO_ISC}</p>
          </details>
          <p>
            La fuente Inter se distribuye bajo la{' '}
            <EnlaceExterno href="https://openfontlicense.org/open-font-license-official-text/">SIL Open Font License 1.1</EnlaceExterno>.
            Puedes consultar{' '}
            <a href="/licencias/inter-OFL.txt" className="font-medium text-emerald-700 underline underline-offset-2">
              su licencia completa
            </a>
            .
          </p>
          <p>
            PDF.js se distribuye bajo la licencia Apache 2.0. Puedes consultar{' '}
            <a href="/licencias/pdfjs-LICENSE.txt" className="font-medium text-emerald-700 underline underline-offset-2">
              su licencia completa
            </a>
            .
          </p>
        </Seccion>
      </main>

      <PieLegal />
    </>
  );
}
