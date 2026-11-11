import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AvisoDatos from './AvisoDatos.jsx';

function pintar(props) {
  const funcionVacia = () => {};
  return renderToStaticMarkup(
    <AvisoDatos
      hayDatos
      instalada={false}
      puedeInstalar={false}
      esIOS={false}
      onInstalar={funcionVacia}
      onExportar={funcionVacia}
      onCerrar={funcionVacia}
      {...props}
    />
  );
}

describe('AvisoDatos', () => {
  it('siempre explica que los datos se pierden al borrar el navegador', () => {
    expect(pintar()).toContain('perderás toda la información');
  });

  it('en iPhone sin instalar avisa del borrado de Safari a los 7 días', () => {
    const html = pintar({ esIOS: true });
    expect(html).toContain('Importante en iPhone y iPad');
    expect(html).toContain('Añadir a pantalla de inicio');
    expect(html).not.toContain('Para instalarla en Android');
  });

  it('en iPhone con la app ya instalada no muestra el aviso de Safari', () => {
    expect(pintar({ esIOS: true, instalada: true })).not.toContain('Importante en iPhone');
  });

  it('en Android muestra cómo instalarla y el botón si el navegador lo permite', () => {
    const html = pintar({ puedeInstalar: true });
    expect(html).toContain('Para instalarla en Android');
    expect(html).toContain('Instalar app');
  });
});
