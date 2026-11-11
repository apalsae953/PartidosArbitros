import { defineConfig } from 'vitest/config';

// Tests de las reglas de seguridad de Firestore. Necesitan el emulador: se lanzan con "npm run test:reglas".
export default defineConfig({
  test: {
    environment: 'node',
    include: ['pruebas/**/*.test.js'],
    testTimeout: 20000,
  },
});
