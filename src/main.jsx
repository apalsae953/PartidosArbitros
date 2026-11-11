import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { pedirAlmacenamientoPersistente } from './lib/dispositivo.js';

pedirAlmacenamientoPersistente();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
