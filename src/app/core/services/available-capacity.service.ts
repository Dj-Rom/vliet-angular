import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';

export interface PalletData {
  ccValue: number;
}

export interface TruckData {
  capacityCC: number;
  readonly Pallets: Record<string, PalletData>;
  readonly palletSize: Record<string, string>;
  currentLoaded: Record<string, number>;
  canLoad: Record<string, number>;
}

export type TruckType = 'TIR' | 'SOLO' | 'TRAILER';

@Injectable({
  providedIn: 'root',
})
export class AvailableCapacityService {
  TIR: TruckData;
  SOLO: TruckData;
  TRAILER: TruckData;

  private saveTimeout?: number;

  constructor(private alert: AlertService) {
    const baseTruck: TruckData = {
      capacityCC: 43,
      Pallets: {
        CC: { ccValue: 1 },
        KK: { ccValue: 1.909 },
        FIN: { ccValue: 1.65 },
        EURO: { ccValue: 1.303 },
        ISO: { ccValue: 1.953 },
      },
      palletSize: {
        CC: 'L135 W57',
        KK: 'L132 W84',
        FIN: 'L120 W100',
        EURO: 'L120 W80',
        ISO: 'L120 W120',
      },
      currentLoaded: { CC: 0, KK: 0, FIN: 0, EURO: 0, ISO: 0 },
      canLoad: { CC: 0, KK: 0, FIN: 0, EURO: 0, ISO: 0 },
    };

    this.TIR = structuredClone(baseTruck);
    this.SOLO = structuredClone(baseTruck);
    this.TRAILER = structuredClone(baseTruck);

    this.TIR.capacityCC = 43;
    this.SOLO.capacityCC = 26;
    this.TRAILER.capacityCC = 23;

    this.loadFromStorage();
    this.recalculateAll();
  }

  getTruck(type: TruckType): TruckData {
    return this[type];
  }

  totalLoad(type: TruckType) {
    const truck = this.getTruck(type);
    const usedCC = Object.entries(truck.currentLoaded).reduce(
      (sum, [key, count]) => sum + truck.Pallets[key].ccValue * count,
      0,
    );
    const percentFull = (usedCC / truck.capacityCC) * 100;
    return {
      usedCC,
      capacityCC: truck.capacityCC,
      percentFull: Math.min(percentFull, 100),
    };
  }

  recalculateCanLoad(type: TruckType) {
    const truck = this.getTruck(type);
    const { usedCC } = this.totalLoad(type);
    const remainingCC = Math.max(truck.capacityCC - usedCC, 0);

    for (const key in truck.Pallets) {
      truck.canLoad[key] = Math.floor(remainingCC / truck.Pallets[key].ccValue);
    }
  }

  recalculateAll() {
    (['TIR', 'SOLO', 'TRAILER'] as const).forEach((t) => this.recalculateCanLoad(t));
    this.debouncedSave();
  }

  updateFromInput(type: any, palletType: string, count: number) {
    const truck = this.getTruck(type);
    if (!truck.Pallets[palletType]) return;

    const validCount = Math.max(0, Math.floor(count));
    const toLoad = Math.min(validCount, truck.canLoad[palletType]);

    truck.currentLoaded[palletType] = toLoad;

    if (toLoad < validCount) {
      this.alert.show('error', `🚫 Pasuje tylko ${toLoad}`);
    }

    this.recalculateAll();
  }

  load(type: any, palletType: string, count: number) {
    const truck = this.getTruck(type);
    if (!truck.Pallets[palletType]) return;

    const validCount = Math.max(0, Math.floor(count));
    const toLoad = Math.min(validCount, truck.canLoad[palletType]);

    truck.currentLoaded[palletType] += toLoad;

    if (toLoad < validCount) {
      this.alert.show('error', `🚫 Pasuje tylko ${toLoad}`);
    }

    this.recalculateAll();
  }

  unload(type: any, palletType: string, count: number) {
    const truck = this.getTruck(type);
    const validCount = Math.max(0, Math.floor(count));
    truck.currentLoaded[palletType] = Math.max(0, truck.currentLoaded[palletType] - validCount);
    this.recalculateAll();
  }

  remainingAll(type: TruckType): Record<string, number> {
    return this.getTruck(type).canLoad;
  }

  resetAll() {
    (['TIR', 'SOLO', 'TRAILER'] as const).forEach((t) => {
      const truck = this.getTruck(t);
      for (const key in truck.currentLoaded) {
        truck.currentLoaded[key] = 0;
      }
      this.recalculateCanLoad(t);
    });
    this.save();
  }

  private debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => this.save(), 300);
  }

  save() {
    localStorage.setItem(
      'truckDataCC',
      JSON.stringify({
        TIR: this.TIR,
        SOLO: this.SOLO,
        TRAILER: this.TRAILER,
      }),
    );
  }

  loadFromStorage() {
    const data = localStorage.getItem('truckDataCC');
    if (!data) return;

    try {
      const parsed = JSON.parse(data);
      for (const t of ['TIR', 'SOLO', 'TRAILER'] as const) {
        const truck = this.getTruck(t);
        if (parsed[t]) {
          truck.currentLoaded = parsed[t].currentLoaded;
          truck.canLoad = parsed[t].canLoad;
        }
      }
    } catch (error) {
      console.error('Failed to load truck data from storage:', error);
    }
  }
}
