import { Injectable, signal, effect, OnDestroy } from '@angular/core';
import { FirebaseClientService, SharedAddress } from '../../firebase/firebase.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoadLocationService implements OnDestroy {
  /* ───────── STATE ───────── */
  listAddress = signal<SharedAddress[]>([]);
  filteredListAddress = signal<SharedAddress[]>([]);
  isLoading = signal(false);
  filterValue = signal('');
  isLiveSyncing = signal(false);

  /* ───────── CACHE CONFIG ───────── */
  private readonly STORAGE_KEY = 'shared_addresses_cache';
  private readonly TIMESTAMP_KEY = 'shared_addresses_timestamp';
  private unsubscribeSnapshot?: () => void;

  constructor(
    private fb: FirebaseClientService,
    private router: Router,
  ) {
    /* autosave cache */
    effect(() => {
      const data = this.listAddress();
      if (data.length > 0) {
        this.saveToCache(data);
      }
    });

    /* auto filter */
    effect(() => {
      this.applyFilter();
    });
  }

  /* ───────── INIT & LIFECYCLE ───────── */
  async init(): Promise<void> {
    this.loadFromCache();
    this.startRealtimeSync();
  }

  ngOnDestroy(): void {
    this.stopRealtimeSync();
  }

  /* ───────── CACHE ───────── */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (!cached) return;

      const data = JSON.parse(cached) as SharedAddress[];
      this.listAddress.set(data);
      this.filteredListAddress.set(data);
    } catch {
      this.clearCache();
    }
  }

  private saveToCache(data: SharedAddress[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.clearCache();
      }
    }
  }

  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TIMESTAMP_KEY);
  }

  /* ───────── REALTIME SYNC (onSnapshot) ───────── */
  startRealtimeSync(): void {
    if (this.unsubscribeSnapshot) return;

    if (this.listAddress().length === 0) {
      this.isLoading.set(true);
    }

    this.isLiveSyncing.set(true);
    this.unsubscribeSnapshot = this.fb.subscribeToSharedAddresses(
      (addresses) => {
        this.isLoading.set(false);
        this.listAddress.set(addresses);
      },
      (error) => {
        console.warn('Realtime subscription error:', error);
        this.isLoading.set(false);
        this.isLiveSyncing.set(false);
      },
    );
  }

  stopRealtimeSync(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = undefined;
      this.isLiveSyncing.set(false);
    }
  }

  /* ───────── MANUAL REFRESH / COMPATIBILITY ───────── */
  async refresh(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    try {
      const data = await this.fb.getSharedAddresses();
      this.listAddress.set(data);
    } finally {
      this.isLoading.set(false);
    }
  }

  async checkForUpdates(): Promise<void> {
    if (!this.unsubscribeSnapshot) {
      await this.refresh();
    }
  }

  /* ───────── FILTER ───────── */
  setFilter(value: string): void {
    this.filterValue.set(value.toLowerCase());
  }

  clearFilter(): void {
    this.filterValue.set('');
  }

  private applyFilter(): void {
    const filter = this.filterValue();
    const data = this.listAddress();

    if (!filter) {
      this.filteredListAddress.set(data);
      return;
    }

    this.filteredListAddress.set(data.filter((a) => a.company.toLowerCase().includes(filter)));
  }

  changePage(add: string): void {
    this.router.navigate(['app/load-location', add]);
  }
}
