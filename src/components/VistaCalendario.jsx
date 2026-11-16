import { useMemo, useState } from 'react';
import Icono from './Icono.jsx';
import { ESTADOS } from '../lib/constantes.js';
import {
  DIAS_SEMANA,
  agruparPorSemana,
  diasHasta,
  enlaceMapa,
  etiquetaDia,
  nombreMesCalendario,
  partidosPorDia,
  proximosPartidos,
  semanasDelMes,
} from '../lib/calendario.js';
import { fechaDeHoy, formatearCentimos, parsearFecha, textoPartidos } from '../lib/formato.js';

const tarjeta = 'rounded-2xl bg-white shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5';

// "en 5 días" para los días cercanos (Hoy y Mañana ya lo dicen, y la semana va en su cabecera)
function textoFaltan(fecha, hoy) {
  const dias = diasHasta(fecha, hoy);
  return dias > 1 && dias < 7 ? `en ${dias} días` : null;
}

// Un partido en la agenda: hora grande, equipos y el lugar con enlace al mapa.
// Toda la tarjeta abre el partido; el enlace del mapa va por encima y funciona aparte.
function PartidoAgenda({ partido, onEditar }) {
  const cobrado = partido.estado === ESTADOS.COBRADO;
  return (
    <li className="relative flex gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 sm:gap-4">
      <button
        type="button"
        onClick={() => onEditar(partido)}
        aria-label={`Abrir partido ${partido.local} contra ${partido.visitante}`}
        className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      />
      <div className="w-14 shrink-0 text-center">
        {partido.hora ? (
          <p className="cifras text-xl font-semibold leading-tight tracking-tight text-slate-900">{partido.hora}</p>
        ) : (
          <p className="pt-1 text-xs font-medium leading-tight text-slate-500">Sin hora</p>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words font-medium leading-snug text-slate-900">
          {partido.local} <span className="font-normal text-slate-400">–</span> {partido.visitante}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {partido.categoria} · <span className="cifras">{formatearCentimos(partido.importeCentimos)}</span> ·{' '}
          <span className={`font-medium ${cobrado ? 'text-emerald-700' : 'text-amber-700'}`}>
            {cobrado ? 'Cobrado' : 'Pendiente de cobro'}
          </span>
        </p>
        {partido.campo ? (
          <a
            href={enlaceMapa(partido.campo)}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 mt-2 inline-flex max-w-full items-start gap-1.5 rounded-md text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Icono nombre="ubicacion" className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{partido.campo}</span>
          </a>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <Icono nombre="ubicacion" className="h-4 w-4 shrink-0" />
            Lugar sin indicar
          </p>
        )}
      </div>
    </li>
  );
}

function ProximosPartidos({ partidos, hoy, onEditar, onNuevo, onImportarPdf }) {
  const semanas = useMemo(() => agruparPorSemana(partidos, hoy), [partidos, hoy]);

  return (
    <section className={`${tarjeta} p-4 sm:p-5`} aria-labelledby="titulo-proximos">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-proximos" className="text-base font-semibold text-slate-900">
          Próximos partidos
        </h2>
        {partidos.length > 0 && <span className="cifras text-sm text-slate-500">{textoPartidos(partidos.length)}</span>}
      </div>

      {semanas.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Icono nombre="calendario" className="h-6 w-6" />
          </span>
          <p className="mt-4 font-medium text-slate-900">No tienes partidos pendientes de pitar</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Añade tu próxima designación o impórtala desde el PDF y aparecerá aquí con su hora y su campo.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => onNuevo()}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-salida hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/30 active:scale-[0.97]"
            >
              <Icono nombre="mas" className="h-4 w-4" />
              Nuevo partido
            </button>
            <button
              type="button"
              onClick={onImportarPdf}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Icono nombre="documento" className="h-4 w-4" />
              Importar PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-5">
          {semanas.map((semana) => (
            <section key={semana.inicio} aria-label={`${semana.titulo}, ${semana.rango}`}>
              {/* Cabecera de la semana (de lunes a domingo): fechas, nº de partidos y lo que se cobrará */}
              <div className="flex items-end justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-200">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{semana.titulo}</h3>
                  <p className="cifras text-xs text-slate-500">{semana.rango}</p>
                </div>
                <p className="cifras shrink-0 text-right text-xs text-slate-500">
                  {textoPartidos(semana.partidos.length)}
                  <span className="block text-sm font-semibold text-slate-900">{formatearCentimos(semana.total)}</span>
                </p>
              </div>

              {semana.dias.map((dia) => {
                const faltan = textoFaltan(dia.fecha, hoy);
                return (
                  <div key={dia.fecha} className="mt-2">
                    <h4 className="flex items-baseline gap-2 px-3 pt-2 text-sm font-semibold text-slate-700">
                      <span className={dia.fecha === hoy ? 'text-emerald-700' : ''}>{etiquetaDia(dia.fecha, hoy)}</span>
                      {faltan && <span className="text-xs font-normal text-slate-500">{faltan}</span>}
                    </h4>
                    <ul className="divide-y divide-slate-100">
                      {dia.partidos.map((partido) => (
                        <PartidoAgenda key={partido.id} partido={partido} onEditar={onEditar} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function CalendarioMes({ porDia, hoy, seleccionado, onSeleccionar }) {
  const inicial = parsearFecha(seleccionado);
  const [mes, setMes] = useState({ anio: inicial.getFullYear(), mes: inicial.getMonth() });
  const semanas = useMemo(() => semanasDelMes(mes.anio, mes.mes), [mes]);

  function moverMes(delta) {
    setMes(({ anio, mes: m }) => {
      const fecha = new Date(anio, m + delta, 1);
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
    });
  }

  function irAHoy() {
    const fecha = parsearFecha(hoy);
    setMes({ anio: fecha.getFullYear(), mes: fecha.getMonth() });
    onSeleccionar(hoy);
  }

  const botonFlecha =
    'flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';

  return (
    <div>
      <div className="flex items-center gap-1">
        <h2 className="flex-1 text-base font-semibold text-slate-900" aria-live="polite">
          {nombreMesCalendario(mes.anio, mes.mes)}
        </h2>
        <button
          type="button"
          onClick={irAHoy}
          className="h-9 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Hoy
        </button>
        <button type="button" onClick={() => moverMes(-1)} aria-label="Mes anterior" className={botonFlecha}>
          <Icono nombre="flechaIzquierda" className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => moverMes(1)} aria-label="Mes siguiente" className={botonFlecha}>
          <Icono nombre="chevronDerecha" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500" aria-hidden="true">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia}>{dia}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label={nombreMesCalendario(mes.anio, mes.mes)}>
        {semanas.flat().map((dia) => {
          const delDia = porDia.get(dia.fecha) || [];
          const esHoy = dia.fecha === hoy;
          const elegido = dia.fecha === seleccionado;
          const pasado = dia.fecha < hoy;
          const textoDia = `${etiquetaDia(dia.fecha, hoy)}${delDia.length ? `, ${textoPartidos(delDia.length)}` : ''}`;
          return (
            <button
              key={dia.fecha}
              type="button"
              role="gridcell"
              aria-selected={elegido}
              aria-label={textoDia}
              onClick={() => onSeleccionar(dia.fecha)}
              className={`flex min-h-[3rem] flex-col items-center rounded-lg px-0.5 pb-1 pt-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:min-h-[4.25rem] ${
                elegido ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-500' : 'hover:bg-slate-50'
              } ${dia.delMes ? '' : 'opacity-40'}`}
            >
              <span
                className={`cifras flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                  esHoy ? 'bg-emerald-600 font-semibold text-white' : pasado ? 'text-slate-500' : 'font-medium text-slate-900'
                }`}
              >
                {dia.numero}
              </span>
              {delDia.length > 0 && (
                <>
                  {/* En móvil, puntos; en pantallas más anchas, la hora del primer partido */}
                  <span className="mt-1 flex gap-0.5 sm:hidden" aria-hidden="true">
                    {delDia.slice(0, 3).map((p) => (
                      <span key={p.id} className={`h-1.5 w-1.5 rounded-full ${pasado ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                    ))}
                  </span>
                  <span
                    className={`cifras mt-1 hidden max-w-full truncate rounded px-1 text-[11px] font-semibold sm:block ${
                      pasado ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                    }`}
                    aria-hidden="true"
                  >
                    {delDia[0].hora || '•'}
                  </span>
                  {/* Si hay más partidos ese día, el número va debajo para que la hora no se corte */}
                  {delDia.length > 1 && (
                    <span className="cifras hidden text-[10px] font-semibold text-slate-500 sm:block" aria-hidden="true">
                      +{delDia.length - 1}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaDia({ fecha, partidos, hoy, onEditar, onNuevo }) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-sm font-semibold text-slate-900">{etiquetaDia(fecha, hoy)}</h3>
        <button
          type="button"
          onClick={() => onNuevo({ fecha })}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Icono nombre="mas" className="h-4 w-4" />
          Añadir
        </button>
      </div>
      {partidos.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-slate-500">Sin partidos este día.</p>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100">
          {partidos.map((partido) => (
            <PartidoAgenda key={partido.id} partido={partido} onEditar={onEditar} />
          ))}
        </ul>
      )}
    </div>
  );
}

// Apartado de calendario: próximos partidos (con hora y campo) y vista mensual con la agenda de cada día
export default function VistaCalendario({ partidos, onEditar, onNuevo, onImportarPdf }) {
  const hoy = fechaDeHoy();
  const proximos = useMemo(() => proximosPartidos(partidos), [partidos]);
  const porDia = useMemo(() => partidosPorDia(partidos), [partidos]);
  // Se empieza mostrando el día del próximo partido (o hoy si no hay ninguno)
  const [seleccionado, setSeleccionado] = useState(() => proximos[0]?.fecha || hoy);

  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <ProximosPartidos
        partidos={proximos}
        hoy={hoy}
        onEditar={onEditar}
        onNuevo={onNuevo}
        onImportarPdf={onImportarPdf}
      />
      <section className={`${tarjeta} p-4 sm:p-5 lg:sticky lg:top-4`} aria-label="Calendario">
        <CalendarioMes porDia={porDia} hoy={hoy} seleccionado={seleccionado} onSeleccionar={setSeleccionado} />
        <AgendaDia
          fecha={seleccionado}
          partidos={porDia.get(seleccionado) || []}
          hoy={hoy}
          onEditar={onEditar}
          onNuevo={onNuevo}
        />
      </section>
    </div>
  );
}
