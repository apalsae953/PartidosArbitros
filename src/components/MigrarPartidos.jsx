import { useState } from 'react';
import Icono from './Icono.jsx';
import { textoPartidos } from '../lib/formato.js';

// Al entrar en la cuenta, ofrece subir los partidos que había guardados solo en este dispositivo
export default function MigrarPartidos({ cantidad, onSubir, onDescartar }) {
  const [ocupado, setOcupado] = useState(false);

  return (
    <section
      aria-label="Partidos guardados en este dispositivo"
      className="flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-200 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 ring-1 ring-emerald-600/10">
          <Icono nombre="nubeSubir" className="h-5 w-5" />
        </span>
        <p className="pt-0.5 text-sm text-emerald-900">
          Tienes <strong className="font-semibold">{textoPartidos(cantidad)}</strong> guardados solo en este dispositivo.
          Súbelos a tu cuenta para verlos también en tus otros dispositivos.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onDescartar}
          disabled={ocupado}
          className="h-9 rounded-lg px-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Ahora no
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setOcupado(true);
            onSubir();
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-salida hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:scale-[0.97]"
        >
          <Icono nombre="nubeSubir" className="h-4 w-4" />
          Subir a mi cuenta
        </button>
      </div>
    </section>
  );
}
