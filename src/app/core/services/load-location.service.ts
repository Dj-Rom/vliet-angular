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

  /* ───────── CACHE CONFIG ───────── */
  private readonly STORAGE_KEY = 'shared_addresses_cache';
  private readonly TIMESTAMP_KEY = 'shared_addresses_timestamp';
  private readonly CHECK_INTERVAL = 3000000;
  private backgroundCheckInterval?: number;

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

  /* ───────── INIT ───────── */
  async init(): Promise<void> {
    this.loadFromCache();
    await this.checkAndUpdateIfNeeded();
    this.startBackgroundSync();
  }

  ngOnDestroy(): void {
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
    }
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

  /* ───────── FIREBASE ───────── */
  async refresh(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    try {
      const data = await this.fb.getSharedAddresses();
      this.listAddress.set(data);
      this.filteredListAddress.set(data);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async checkAndUpdateIfNeeded(): Promise<void> {
    const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
    const age = timestamp ? Date.now() - +timestamp : Infinity;

    if (age > 5 * 60 * 1000 || this.listAddress().length === 0) {
      await this.refresh();
    }
  }

  /* ───────── BACKGROUND SYNC ───────── */
  private startBackgroundSync(): void {
    this.backgroundCheckInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, this.CHECK_INTERVAL);
  }

  async checkForUpdates(): Promise<void> {
    try {
      const fresh = await this.fb.getSharedAddresses();
      if (this.hasChanges(this.listAddress(), fresh)) {
        this.listAddress.set(fresh);
      }
    } catch {}
  }

  private hasChanges(a: SharedAddress[], b: SharedAddress[]): boolean {
    return a.length !== b.length || JSON.stringify(a) !== JSON.stringify(b);
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
