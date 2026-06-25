import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Deploy recovery: after a new build, lazy-chunk filenames change. A tab holding the
// old index.html requests a now-deleted chunk → server returns index.html (MIME
// text/html) → "Failed to fetch dynamically imported module" → blank page. Vite fires
// `vite:preloadError`; reload once (time-guarded, so a genuine 404 can't loop) to pull
// the new build instead of crashing.
window.addEventListener('vite:preloadError', (event) => {
  const last = Number(sessionStorage.getItem('vitePreloadReloadAt') || 0);
  if (Date.now() - last > 10000) {
    sessionStorage.setItem('vitePreloadReloadAt', String(Date.now()));
    event.preventDefault();
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/portal">
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
