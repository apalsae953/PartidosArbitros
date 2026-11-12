import { describe, expect, it } from 'vitest';
import { detectarPlataforma } from './dispositivo.js';

const navegador = (userAgent, extra = {}) => ({ userAgent, platform: '', maxTouchPoints: 0, ...extra });

// Identificadores reales (abreviados) de los navegadores más habituales
const UA = {
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  chromeIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  whatsappIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/24.21.77',
  ipad:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  samsungAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:132.0) Gecko/132.0 Firefox/132.0',
  instagramAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-S921B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 Instagram 356.0',
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

describe('detectarPlataforma', () => {
  it('reconoce los navegadores de iPhone', () => {
    expect(detectarPlataforma(navegador(UA.safariIphone))).toEqual({ sistema: 'ios', navegador: 'safari' });
    expect(detectarPlataforma(navegador(UA.chromeIphone))).toEqual({ sistema: 'ios', navegador: 'chrome' });
    expect(detectarPlataforma(navegador(UA.whatsappIphone))).toEqual({ sistema: 'ios', navegador: 'integrado' });
  });

  it('reconoce el iPad aunque se identifique como Mac', () => {
    expect(detectarPlataforma(navegador(UA.ipad, { platform: 'MacIntel', maxTouchPoints: 5 }))).toEqual({
      sistema: 'ios',
      navegador: 'safari',
    });
  });

  it('reconoce los navegadores de Android', () => {
    expect(detectarPlataforma(navegador(UA.chromeAndroid))).toEqual({ sistema: 'android', navegador: 'chrome' });
    expect(detectarPlataforma(navegador(UA.samsungAndroid))).toEqual({ sistema: 'android', navegador: 'samsung' });
    expect(detectarPlataforma(navegador(UA.firefoxAndroid))).toEqual({ sistema: 'android', navegador: 'firefox' });
    expect(detectarPlataforma(navegador(UA.instagramAndroid))).toEqual({ sistema: 'android', navegador: 'integrado' });
  });

  it('distingue el ordenador', () => {
    expect(detectarPlataforma(navegador(UA.chromeWindows))).toEqual({ sistema: 'escritorio', navegador: 'chrome' });
  });
});
