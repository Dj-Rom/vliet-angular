import { _WayBill } from '../../../../interfaces';
import { FirebaseClientService } from '../../../firebase/firebase.service';
import { Injectable, signal, computed, effect, OnDestroy } from '@angular/core';
import { formatDateTime, safeDate } from '../../../helpers/formatDateTime';
import { AlertService } from '../../../core/services/alert.service';

@Injectable({ providedIn: 'root' })
export class WaybillsService implements OnDestroy {
  isReportOpen = signal<boolean>(false);

  readonly waybills = signal<_WayBill[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  isOpenModalFormForAddNewVehicle = signal(false);

  private readonly STORAGE_KEY = 'waybills_cache';
  private readonly TIMESTAMP_KEY = 'waybills_timestamp';
  private readonly CHECK_INTERVAL = 3000000;

  private backgroundCheckInterval?: number;

  constructor(
    private fb: FirebaseClientService,
    private alert: AlertService,
  ) {
    this.initializeFromCache();
    this.startBackgroundSync();

    effect(() => {
      const data = this.waybills();
      if (data.length > 0) {
        this.saveToCache(data);
      }
    });
  }

  private initializeFromCache(): void {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as _WayBill[];
        this.waybills.set(data);

        this.checkAndUpdateIfNeeded();
      } else {
        this.loadWaybills();
      }
    } catch (error) {
      console.error('❌ Error loading from cache:', error);
      this.loadWaybills();
    }
  }

  private saveToCache(data: _WayBill[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  private async checkAndUpdateIfNeeded(): Promise<void> {
    try {
      const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
      const now = Date.now();
      const cacheAge = timestamp ? now - parseInt(timestamp) : Infinity;

      if (cacheAge > 5 * 60 * 1000) {
        await this.loadWaybills();
      }
    } catch (error) {
      console.error('❌ Error checking cache age:', error);
    }
  }

  private startBackgroundSync(): void {
    this.backgroundCheckInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, this.CHECK_INTERVAL);
  }

  async checkForUpdates(): Promise<void> {
    try {
      const freshData = await this.fb.getWillBillsHistory();
      const currentData = this.waybills();

      if (this.hasChanges(currentData, freshData)) {
        this.waybills.set(freshData);
        this.saveToCache(freshData);
      }
    } catch (error) {
      console.error('❌ Background sync error:', error);
    }
  }

  private hasChanges(current: _WayBill[], fresh: _WayBill[]): boolean {
    if (current.length !== fresh.length) return true;

    return JSON.stringify(current) !== JSON.stringify(fresh);
  }

  async loadWaybills(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const data = await this.fb.getWillBillsHistory();
      this.waybills.set(data);
      this.saveToCache(data);
    } catch (error) {
      this.alert.show('error', `Error: ${error}`);
      this.error.set('Failed to load waybills');
    } finally {
      this.isLoading.set(false);
    }
  }

  refresh(): void {
    this.loadWaybills();
  }

  async getWaybillById(id: string) {
    let res = this.waybills().find((w) => w.id === id);
    if (res) return res;

    await this.loadWaybills();
    res = this.waybills().find((w) => w.id === id);
    if (res) return res;

    return this.fb.getWillBillsHistory().then((data) => data.find((w) => w.id === id));
  }

  addWaybill(newWaybill: _WayBill) {
    this.waybills.update((list) => [...list, newWaybill]);
  }

  updateWaybill(updated: _WayBill) {
    this.waybills.update((list) => list.map((w) => (w.id === updated.id ? updated : w)));
  }

  removeWaybill(id: string) {
    this.waybills.update((list) => list.filter((w) => w.id !== id));
  }

  readonly totalBillableDays = computed(() =>
    this.waybills().reduce((sum, w) => sum + (w.billableDays ?? 0), 0),
  );

  async checkIfWaybillExistAsync(d: string): Promise<boolean> {
    const target = safeDate(d);
    if (!target) {
      this.alert.show('error', 'Target is invalid');
      return false;
    }

    if (this.waybills().length === 0) {
      await this.loadWaybills();
    }

    const exists = this.waybills().some((w) => {
      const start = safeDate(w.dataStart);
      const finishRaw = safeDate(w.dataFinish);
      const finish = finishRaw ?? start;

      if (!start) return false;

      const startYMD = [start.getFullYear(), start.getMonth(), start.getDate()];
      const finishYMD = [finish!.getFullYear(), finish!.getMonth(), finish!.getDate()];
      const targetYMD = [target.getFullYear(), target.getMonth(), target.getDate()];

      if (
        targetYMD[0] === startYMD[0] &&
        targetYMD[1] === startYMD[1] &&
        targetYMD[2] >= startYMD[2] &&
        targetYMD[0] === finishYMD[0] &&
        targetYMD[1] === finishYMD[1] &&
        targetYMD[2] <= finishYMD[2]
      ) {
        return true;
      }

      return false;
    });

    return !exists;
  }

  readonly trucksUsed = computed(() => Array.from(new Set(this.waybills().map((w) => w.truck))));

  ngOnDestroy(): void {
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
    }
  }

  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TIMESTAMP_KEY);
  }
}
