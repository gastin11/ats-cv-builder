import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { useCvStore } from './stores/cvStore';

if (import.meta.env.DEV) {
  // convenience hook for manual testing in the browser console
  (window as unknown as Record<string, unknown>).__cvStore = useCvStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
