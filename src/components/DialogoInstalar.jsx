import { useState } from 'react';
import Icono from './Icono.jsx';
import VentanaModal from './VentanaModal.jsx';

// Botón o menú del navegador que hay que pulsar, dibujado para que se reconozca en pantalla
function Tecla({ icono, children }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 align-middle text-[0.8125rem] font-semibold text-slate-800 ring-1 ring-inset ring-slate-200">
      {icono && <Icono nombre={icono} className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function Pasos({ pasos }) {
  return (
    <ol className="space-y-3">
      {pasos.map((paso, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
            {i + 1}
          </span>
          <p className="pt-0.5 text-sm leading-relaxed text-slate-700">{paso}</p>
        </li>
      ))}
    </ol>
  );
}

// Desde WhatsApp, Instagram, Gmail... no se puede instalar: hay que abrir la página en el navegador normal
function AbrirEnNavegador({ nombreNavegador }) {
  const [copiado, setCopiado] = useState(false);

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-700">
        Estás viendo la web dentro de otra app (WhatsApp, Instagram, Gmail…), y desde ahí no se puede instalar. Ábrela en{' '}
        <strong className="font-semibold">{nombreNavegador}</strong>:
      </p>
      <Pasos
        pasos={[
          <>
            Busca en el menú de esta pantalla la opción <Tecla>Abrir en {nombreNavegador}</Tecla> o{' '}
            <Tecla>Abrir en el navegador</Tecla>.
          </>,
          'Si no aparece, copia el enlace con el botón de abajo y pégalo en la barra de direcciones del navegador.',
          'Una vez abierta allí, pulsa de nuevo «Instalar» y sigue los pasos.',
        ]}
      />
      <button
        type="button"
        onClick={copiarEnlace}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Icono nombre={copiado ? 'check' : 'copiar'} className="h-4 w-4" />
        {copiado ? 'Enlace copiado' : 'Copiar el enlace de la web'}
      </button>
    </div>
  );
}

function instrucciones({ sistema, navegador }) {
  if (sistema === 'ios') {
    if (navegador === 'integrado') return <AbrirEnNavegador nombreNavegador="Safari" />;
    if (navegador === 'safari' || navegador === 'otro') {
      return (
        <Pasos
          pasos={[
            <>
              Pulsa el botón <Tecla icono="compartir">Compartir</Tecla> en la barra de abajo (en iPad, arriba a la
              derecha).
            </>,
            <>
              Desliza hacia abajo y elige <Tecla icono="anadirCuadro">Añadir a pantalla de inicio</Tecla>.
            </>,
            <>
              Pulsa <Tecla>Añadir</Tecla>. A partir de ahora, abre la app siempre desde su icono.
            </>,
          ]}
        />
      );
    }
    // Chrome, Firefox o Edge en iPhone (iOS 16.4 o posterior)
    return (
      <div className="space-y-4">
        <Pasos
          pasos={[
            <>
              Pulsa el botón <Tecla icono="compartir">Compartir</Tecla>, junto a la barra de direcciones (en Firefox y
              Edge, dentro del menú <Tecla icono="menuLineas">Menú</Tecla>).
            </>,
            <>
              Elige <Tecla icono="anadirCuadro">Añadir a pantalla de inicio</Tecla> y pulsa <Tecla>Añadir</Tecla>.
            </>,
          ]}
        />
        <p className="text-xs leading-relaxed text-slate-500">
          Si no te aparece esa opción, abre esta web en Safari y sigue allí los mismos pasos.
        </p>
      </div>
    );
  }

  if (sistema === 'android') {
    if (navegador === 'integrado') return <AbrirEnNavegador nombreNavegador="Chrome" />;
    if (navegador === 'samsung') {
      return (
        <Pasos
          pasos={[
            <>
              Pulsa el menú <Tecla icono="menuLineas">Menú</Tecla> en la barra de abajo.
            </>,
            <>
              Elige <Tecla icono="anadirCuadro">Añadir página a</Tecla> y luego <Tecla>Pantalla de inicio</Tecla>.
            </>,
            <>
              Confirma con <Tecla>Añadir</Tecla>.
            </>,
          ]}
        />
      );
    }
    if (navegador === 'firefox') {
      return (
        <Pasos
          pasos={[
            <>
              Pulsa el menú <Tecla icono="menuPuntos">Menú</Tecla>.
            </>,
            <>
              Elige <Tecla icono="movil">Instalar</Tecla> o <Tecla>Añadir a pantalla de inicio</Tecla>.
            </>,
          ]}
        />
      );
    }
    return (
      <div className="space-y-4">
        <Pasos
          pasos={[
            <>
              Pulsa el menú <Tecla icono="menuPuntos">Menú</Tecla>, arriba a la derecha.
            </>,
            <>
              Elige <Tecla icono="movil">Instalar aplicación</Tecla> o <Tecla icono="anadirCuadro">Añadir a pantalla de inicio</Tecla>.
            </>,
            <>
              Confirma con <Tecla>Instalar</Tecla>.
            </>,
          ]}
        />
        <p className="text-xs leading-relaxed text-slate-500">
          Si antes cerraste el aviso de instalación de Chrome, la opción sigue estando en ese menú.
        </p>
      </div>
    );
  }

  // Ordenador
  return (
    <Pasos
      pasos={[
        <>
          En Chrome o Edge, pulsa el icono de instalar <Tecla icono="descargar">Instalar</Tecla> que aparece a la derecha
          de la barra de direcciones, o búscalo en el menú <Tecla icono="menuPuntos">Menú</Tecla>.
        </>,
        <>
          En Safari para Mac, usa <Tecla>Archivo</Tecla> y luego <Tecla>Añadir al Dock</Tecla>.
        </>,
      ]}
    />
  );
}

// Explica cómo instalar la app cuando el navegador no ofrece el botón de instalación directa (siempre en iPhone)
export default function DialogoInstalar({ abierto, apertura, plataforma, onCerrar }) {
  return (
    <VentanaModal abierto={abierto} apertura={apertura} titulo="Instalar la app" onCerrar={onCerrar}>
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-inset ring-emerald-200">
        <img src="/icons/icon-192.png" alt="" width="44" height="44" className="h-11 w-11 shrink-0 rounded-xl" />
        <p className="text-sm leading-snug text-emerald-900">
          Tendrás <strong className="font-semibold">Mis Arbitrajes</strong> como una app más: con su icono, a pantalla
          completa y funcionando sin conexión.
        </p>
      </div>
      {instrucciones(plataforma)}
      {plataforma.sistema === 'ios' && plataforma.navegador !== 'integrado' && (
        <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-200">
          En iPhone es importante: si no la instalas, Safari puede borrar los datos guardados en el móvil cuando pasan 7
          días sin abrir la web.
        </p>
      )}
    </VentanaModal>
  );
}
