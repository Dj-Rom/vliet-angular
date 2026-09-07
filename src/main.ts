import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = (
      event.reason?.message ||
      event.reason?.stack ||
      event.reason?.toString() ||
      ''
    ).toLowerCase();

    if (
      reason.includes('failed to fetch dynamically imported module') ||
      reason.includes('loading chunk') ||
      reason.includes('chunkloaderror') ||
      reason.includes('importing a module script failed')
    ) {
      const lastReload = sessionStorage.getItem('vliet_chunk_reload_ts');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('vliet_chunk_reload_ts', now.toString());
        console.warn('[main.ts] Dynamic module chunk error, reloading latest app bundle...');
        window.location.reload();
      }
    }
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
