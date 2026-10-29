import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker (Phase 8C)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Sovereign PWA ServiceWorker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('Sovereign PWA ServiceWorker registration skipped:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
