import { useState } from 'react';
import Icono from './Icono.jsx';
import VentanaModal from './VentanaModal.jsx';
import { textoPartidos } from '../lib/formato.js';
import { mensajeError } from '../lib/nube/errores.js';

const MIN_CONTRASENA = 8;

const clasesEntrada =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 sm:text-sm';

const clasesBoton =
  'inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-salida focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100';

// Logotipo de Google (marca oficial de color, necesaria en el botón de acceso con Google)
function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.26 6.62l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function Mensaje({ tipo, children }) {
  if (!children) return null;
  const estilos = tipo === 'error' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  return (
    <p role={tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg p-3 text-sm ring-1 ring-inset ${estilos}`}>
      <Icono nombre={tipo === 'error' ? 'alerta' : 'check'} className="mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </p>
  );
}

// Formulario para entrar o crear una cuenta
function Acceso({ servicio }) {
  const [modo, setModo] = useState('entrar');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  async function ejecutar(accion) {
    setError('');
    setAviso('');
    setOcupado(true);
    try {
      await accion();
    } catch (fallo) {
      const mensaje = mensajeError(fallo);
      if (mensaje) setError(mensaje);
      if (!fallo?.code) console.warn(fallo);
    } finally {
      setOcupado(false);
    }
  }

  function enviar(evento) {
    evento.preventDefault();
    const correo = email.trim();
    if (!correo || !contrasena) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    if (modo === 'crear' && contrasena.length < MIN_CONTRASENA) {
      setError(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`);
      return;
    }
    ejecutar(() => (modo === 'crear' ? servicio.crearCuenta(correo, contrasena) : servicio.entrarConCorreo(correo, contrasena)));
  }

  function recuperar() {
    const correo = email.trim();
    if (!correo) {
      setError('Escribe tu correo arriba y vuelve a pulsar para recibir el enlace.');
      return;
    }
    ejecutar(async () => {
      await servicio.recuperarContrasena(correo);
      setAviso(`Si existe una cuenta con ${correo}, recibirás un correo para crear una contraseña nueva.`);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Con una cuenta tus partidos se guardan en la nube y los ves igual en el móvil y en el ordenador.
      </p>

      <button
        type="button"
        disabled={ocupado}
        onClick={() => ejecutar(() => servicio.entrarConGoogle())}
        className={`${clasesBoton} bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500`}
      >
        <LogoGoogle />
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />o con tu correo<span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Tipo de acceso">
        {[
          ['entrar', 'Entrar'],
          ['crear', 'Crear cuenta'],
        ].map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={modo === valor}
            onClick={() => {
              setModo(valor);
              setError('');
              setAviso('');
            }}
            className={`h-9 rounded-md text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              modo === valor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} noValidate className="space-y-3">
        <div>
          <label htmlFor="cuenta-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Correo
          </label>
          <input
            id="cuenta-email"
            data-autofoco=""
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={clasesEntrada}
          />
        </div>
        <div>
          <label htmlFor="cuenta-contrasena" className="mb-1.5 block text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            id="cuenta-contrasena"
            type="password"
            autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className={clasesEntrada}
          />
          {modo === 'crear' && <p className="mt-1.5 text-xs text-slate-500">Mínimo {MIN_CONTRASENA} caracteres.</p>}
        </div>

        <Mensaje tipo="error">{error}</Mensaje>
        <Mensaje tipo="exito">{aviso}</Mensaje>

        <button
          type="submit"
          disabled={ocupado}
          className={`${clasesBoton} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-500/30`}
        >
          {ocupado && <Icono nombre="cargando" className="h-4 w-4 animate-spin" />}
          {modo === 'crear' ? 'Crear cuenta' : 'Entrar'}
        </button>

        {modo === 'entrar' && (
          <button
            type="button"
            onClick={recuperar}
            disabled={ocupado}
            className="w-full text-center text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
          >
            ¿Has olvidado tu contraseña?
          </button>
        )}
      </form>

      <p className="text-xs leading-relaxed text-slate-500">
        Al crear una cuenta aceptas el{' '}
        <a href="/legal.html#aviso-legal" className="underline underline-offset-2 hover:text-slate-800">
          aviso legal
        </a>{' '}
        y la{' '}
        <a href="/legal.html#privacidad" className="underline underline-offset-2 hover:text-slate-800">
          política de privacidad
        </a>
        .
      </p>
    </div>
  );
}

function textoSincronizacion(nube) {
  if (nube.cargando) return 'Cargando tus partidos…';
  if (nube.pendientes) return nube.sinConexion ? 'Sin conexión: los cambios se subirán al volver a tener red' : 'Guardando cambios…';
  if (nube.sinConexion) return 'Sin conexión: estás viendo la copia guardada en este dispositivo';
  return 'Todo guardado en la nube';
}

// Datos de la cuenta, cerrar sesión y eliminar cuenta
function Perfil({ usuario, servicio, nube, numPartidos, onExportar }) {
  const [paso, setPaso] = useState('perfil');
  const [contrasena, setContrasena] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  async function salir() {
    setOcupado(true);
    try {
      await servicio.cerrarSesion();
    } finally {
      // Se recarga para empezar limpio con los datos del dispositivo
      window.location.reload();
    }
  }

  async function eliminar(evento) {
    evento.preventDefault();
    setError('');
    setOcupado(true);
    try {
      await servicio.eliminarCuenta({ contrasena });
      window.location.reload();
    } catch (fallo) {
      const mensaje = mensajeError(fallo);
      if (mensaje) setError(mensaje);
      setOcupado(false);
    }
  }

  const inicial = (usuario.nombre || usuario.email || '?').charAt(0).toUpperCase();
  const sincronizado = !nube.cargando && !nube.pendientes && !nube.sinConexion;

  if (paso === 'eliminar') {
    return (
      <form onSubmit={eliminar} className="space-y-4">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-inset ring-red-200">
          <p className="font-semibold">Vas a eliminar tu cuenta</p>
          <p className="mt-1">
            Se borrarán tu cuenta y {numPartidos === 1 ? 'tu partido' : `tus ${textoPartidos(numPartidos)}`} de la nube. Esto no se
            puede deshacer.
          </p>
        </div>
        {numPartidos > 0 && (
          <button
            type="button"
            onClick={onExportar}
            className={`${clasesBoton} text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400`}
          >
            <Icono nombre="descargar" className="h-4 w-4" />
            Descargar antes una copia de mis partidos
          </button>
        )}
        {usuario.conContrasena ? (
          <div>
            <label htmlFor="cuenta-confirmar" className="mb-1.5 block text-sm font-medium text-slate-700">
              Escribe tu contraseña para confirmar
            </label>
            <input
              id="cuenta-confirmar"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className={clasesEntrada}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600">Para confirmar, Google te pedirá que elijas tu cuenta de nuevo.</p>
        )}
        <Mensaje tipo="error">{error}</Mensaje>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaso('perfil')}
            disabled={ocupado}
            className={`${clasesBoton} text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={ocupado || (usuario.conContrasena && !contrasena)}
            className={`${clasesBoton} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-4 focus-visible:ring-red-500/30`}
          >
            {ocupado && <Icono nombre="cargando" className="h-4 w-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white">
          {inicial}
        </span>
        <div className="min-w-0">
          {usuario.nombre && <p className="truncate font-semibold text-slate-900">{usuario.nombre}</p>}
          <p className="truncate text-sm text-slate-600">{usuario.email}</p>
          <p className="text-xs text-slate-400">{usuario.conGoogle ? 'Cuenta de Google' : 'Correo y contraseña'}</p>
        </div>
      </div>

      <p
        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 ring-inset ${
          sincronizado ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-slate-50 text-slate-700 ring-slate-200'
        }`}
      >
        <Icono nombre={sincronizado ? 'nube' : 'nubeSubir'} className="h-4 w-4 shrink-0" />
        {textoSincronizacion(nube)}
      </p>

      <button
        type="button"
        onClick={salir}
        disabled={ocupado}
        className={`${clasesBoton} text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400`}
      >
        <Icono nombre="salir" className="h-4 w-4" />
        Cerrar sesión
      </button>
      {nube.pendientes && (
        <p className="text-xs text-amber-700">
          Hay cambios sin subir. Si cierras sesión ahora sin conexión, se perderán.
        </p>
      )}

      <div className="border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => setPaso('eliminar')}
          className="text-sm font-medium text-red-600 underline decoration-red-200 underline-offset-2 hover:text-red-700"
        >
          Eliminar mi cuenta y mis datos
        </button>
      </div>
    </div>
  );
}

export default function DialogoCuenta({ abierto, apertura, sesion, nube, numPartidos, onExportar, onCerrar }) {
  const conectado = sesion.estado === 'conectado';
  return (
    <VentanaModal abierto={abierto} apertura={apertura} titulo={conectado ? 'Tu cuenta' : 'Entrar o crear cuenta'} onCerrar={onCerrar}>
      {!sesion.servicio ? (
        <div className="flex flex-col items-center py-10 text-center" role="status">
          <Icono nombre="cargando" className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">Cargando…</p>
        </div>
      ) : conectado ? (
        <Perfil
          key={sesion.usuario.uid}
          usuario={sesion.usuario}
          servicio={sesion.servicio}
          nube={nube}
          numPartidos={numPartidos}
          onExportar={onExportar}
        />
      ) : (
        <Acceso key={apertura} servicio={sesion.servicio} />
      )}
    </VentanaModal>
  );
}
