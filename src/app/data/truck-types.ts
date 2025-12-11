export interface PalletData {
  ccValue: number;
}

export interface TruckData {
  capacityCC: number;
  Pallets: Record<string, PalletData>;
  palletSize: Record<string,string>
  currentLoaded: Record<string, number>;
  canLoad: Record<string, number>;
}

export class TruckTypes {
  TIR: TruckData;
  SOLO: TruckData;
  TRAILER: TruckData;

  constructor() {
    const baseTruck: TruckData = {
      capacityCC: 43, // full tir only 43 cc or 22KK + 1 cc
      Pallets: {
        CC: { ccValue: 1},
        KK: { ccValue: 1.909 },
        FIN: { ccValue: 1.65 },
        EURO : { ccValue: 1.303 },
        ISO: { ccValue: 1.953 },
      },
      palletSize:{
        CC: "L135 W57",
        KK: "",
        FIN: "L120 W100",
        EURO : "L120 W80",
        ISO: "L120 W120",
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

  getTruck(type: keyof TruckTypes): TruckData {
    return this[type] as TruckData;
  }


  totalLoad(type: keyof TruckTypes) {
    const truck = this.getTruck(type);
    const usedCC = Object.entries(truck.currentLoaded).reduce(
      (sum, [key, count]) => sum + truck.Pallets[key].ccValue * count,
      0
    );
    const percentFull = (usedCC / truck.capacityCC) * 100;
    return { usedCC, capacityCC: truck.capacityCC, percentFull: Math.min(percentFull, 100) };
  }


  recalculateCanLoad(type: keyof TruckTypes) {
    const truck = this.getTruck(type);
    const { usedCC } = this.totalLoad(type);
    const remainingCC = Math.max(truck.capacityCC - usedCC, 0);
    for (const key in truck.Pallets) {
      truck.canLoad[key] = Math.floor(remainingCC / truck.Pallets[key].ccValue);
    }
  }

  recalculateAll() {
    (['TIR', 'SOLO', 'TRAILER'] as const).forEach((t) => this.recalculateCanLoad(t));
    this.save();
  }

  load(type: keyof TruckTypes, palletType: string, count: number) {
    const truck = this.getTruck(type);
    if (!truck.Pallets[palletType]) return;
    const canLoad = truck.canLoad[palletType];
    const toLoad = Math.min(count, canLoad);
    truck.currentLoaded[palletType] += toLoad;
    if (toLoad < count) alert(`🚫 Поместилось только ${toLoad} из ${count}`);
    this.recalculateAll();
  }

  unload(type: keyof TruckTypes, palletType: string, count: number) {
    const truck = this.getTruck(type);
    truck.currentLoaded[palletType] = Math.max(0, truck.currentLoaded[palletType] - count);
    this.recalculateAll();
  }

  remainingAll(type: keyof TruckTypes): Record<string, number> {
    return this.getTruck(type).canLoad;
  }

  resetAll() {
    (['TIR', 'SOLO', 'TRAILER'] as const).forEach((t) => {
      const truck = this.getTruck(t);
      for (const key in truck.currentLoaded) truck.currentLoaded[key] = 0;
      this.recalculateCanLoad(t);
    });
    this.save();
  }

  save() {
    localStorage.setItem('truckDataCC', JSON.stringify({
      TIR: this.TIR,
      SOLO: this.SOLO,
      TRAILER: this.TRAILER
    }));
  }

  loadFromStorage() {
    const data = localStorage.getItem('truckDataCC');
    if (!data) return;
    const parsed = JSON.parse(data);
    for (const t of ['TIR','SOLO','TRAILER'] as const) {
      const truck = this.getTruck(t);
      if (parsed[t]) {
        truck.currentLoaded = parsed[t].currentLoaded;
        truck.canLoad = parsed[t].canLoad;
      }
    }
  }
}
