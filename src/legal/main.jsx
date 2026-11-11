import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import PaginaLegal from './PaginaLegal.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PaginaLegal />
  </StrictMode>
);
