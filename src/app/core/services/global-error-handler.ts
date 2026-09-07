import { ErrorHandler, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const errorMsg = (
      error?.message ||
      error?.stack ||
      error?.toString() ||
      ''
    ).toLowerCase();

    const isChunkError =
      errorMsg.includes('failed to fetch dynamically imported module') ||
      errorMsg.includes('loading chunk') ||
      errorMsg.includes('chunkloaderror') ||
      errorMsg.includes('importing a module script failed') ||
      errorMsg.includes('error loading dynamically imported module');

    if (isChunkError && typeof window !== 'undefined') {
      const lastReload = sessionStorage.getItem('vliet_chunk_reload_ts');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('vliet_chunk_reload_ts', now.toString());
        console.warn(
          '[GlobalErrorHandler] Chunk loading error detected (new app version on server). Reloading to refresh bundles...',
          error,
        );
        window.location.reload();
        return;
      }
    }

    console.error('Unhandled application error:', error);
  }
}
