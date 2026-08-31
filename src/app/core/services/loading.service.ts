import { Injectable, signal, computed } from '@angular/core';

/**
 * Global loading service.
 * Tracks multiple independent loading sources (Firebase, router, etc.)
 * and exposes a single computed `isLoading` signal that is true
 * as long as at least one source is active.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _activeCount = signal(0);

  /** True when ANY async operation is in progress */
  readonly isLoading = computed(() => this._activeCount() > 0);

  start(): void {
    this._activeCount.update((n) => n + 1);
  }

  stop(): void {
    this._activeCount.update((n) => Math.max(0, n - 1));
  }

  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    this.start();
    try {
      return await fn();
    } finally {
      this.stop();
    }
  }
}
