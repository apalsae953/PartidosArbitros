// Enlaces a la información legal, compartidos por la app y la página legal
export default function PieLegal({ children }) {
  return (
    <footer className="mx-auto max-w-6xl space-y-2 px-4 pb-8 text-xs text-slate-500 sm:px-6">
      {children}
      <nav aria-label="Información legal" className="flex flex-wrap gap-x-4 gap-y-1">
        <a href="/legal#aviso-legal" className="hover:text-slate-900 hover:underline">
          Aviso legal
        </a>
        <a href="/legal#privacidad" className="hover:text-slate-900 hover:underline">
          Privacidad
        </a>
        <a href="/legal#cookies" className="hover:text-slate-900 hover:underline">
          Cookies
        </a>
        <a href="/legal#licencias" className="hover:text-slate-900 hover:underline">
          Licencias
        </a>
      </nav>
    </footer>
  );
}
