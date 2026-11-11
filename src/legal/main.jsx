import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { activarAnalitica } from '../lib/analitica.js';
import PaginaLegal from './PaginaLegal.jsx';

activarAnalitica();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PaginaLegal />
  </StrictMode>
);
