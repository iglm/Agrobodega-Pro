
/**
 * DatosFinca Viva
 * Copyright (c) 2025 Lucas Mateo Tabares Franco. Todos los derechos reservados.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { syncService } from './services/syncService';

// Arrancamos el monitor de sincronización
syncService.initAutoSync();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
