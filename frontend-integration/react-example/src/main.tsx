import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTracing } from './tracing';
import App from './App';
import './index.css';

initTracing();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
