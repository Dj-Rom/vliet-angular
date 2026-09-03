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
  isLiveSyncing = signal(false);

  private readonly STORAGE_KEY = 'waybills_cache';
  private readonly TIMESTAMP_KEY = 'waybills_timestamp';
  private unsubscribeSnapshot?: () => void;

  constructor(
    private fb: FirebaseClientService,
    private alert: AlertService,
  ) {
    this.initializeFromCache();

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
      }
    } catch (error) {
      console.error('❌ Error loading from cache:', error);
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

  /* ───────── REALTIME SYNC (onSnapshot) ───────── */
  startRealtimeSync(): void {
    if (this.unsubscribeSnapshot) return;

    if (this.waybills().length === 0) {
      this.isLoading.set(true);
    }

    this.isLiveSyncing.set(true);
    this.unsubscribeSnapshot = this.fb.subscribeToWayBillsHistory(
      (freshData) => {
        this.isLoading.set(false);
        this.waybills.set(freshData);
      },
      (error) => {
        console.warn('❌ Realtime waybills sync error:', error);
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

  async checkForUpdates(): Promise<void> {
    if (!this.unsubscribeSnapshot) {
      await this.loadWaybills();
    }
  }

  async loadWaybills(): Promise<void> {
    if (this.unsubscribeSnapshot && this.waybills().length > 0) {
      return;
    }

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
    this.stopRealtimeSync();
  }

  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TIMESTAMP_KEY);
  }
}
