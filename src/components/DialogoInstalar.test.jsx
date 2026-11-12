import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DialogoInstalar from './DialogoInstalar.jsx';

const pintar = (sistema, navegador) =>
  renderToStaticMarkup(<DialogoInstalar abierto apertura={1} plataforma={{ sistema, navegador }} onCerrar={() => {}} />);

describe('DialogoInstalar', () => {
  it('en iPhone con Safari explica Compartir › Añadir a pantalla de inicio', () => {
    const html = pintar('ios', 'safari');
    expect(html).toContain('Compartir');
    expect(html).toContain('Añadir a pantalla de inicio');
    expect(html).toContain('7');
  });

  it('en iPhone dentro de WhatsApp o Instagram pide abrir la web en Safari', () => {
    const html = pintar('ios', 'integrado');
    expect(html).toContain('Abrir en Safari');
    expect(html).toContain('Copiar el enlace');
  });

  it('en iPhone con Chrome indica el botón Compartir junto a la barra de direcciones', () => {
    expect(pintar('ios', 'chrome')).toContain('junto a la barra de direcciones');
  });

  it('en Android adapta los pasos al navegador', () => {
    expect(pintar('android', 'chrome')).toContain('Instalar aplicación');
    expect(pintar('android', 'samsung')).toContain('Añadir página a');
    expect(pintar('android', 'integrado')).toContain('Abrir en Chrome');
  });
});
