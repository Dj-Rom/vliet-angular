import { Injectable, signal, computed } from '@angular/core';
import { FirebaseClientService } from '../../../firebase/firebase.service';
import { MONTHS } from '../component/calendar/calendar';
import { Location } from '@angular/common';
import { AlertService } from '../../../core/services/alert.service';
import { mergeDateTime } from '../../../helpers/formatDateTime';
import { WaybillsService } from './waybills.service';

interface Vehicle {
  truck: string;
  trailer: string;
}

interface WaybillDate {
  dataStart: string;
  timeStart: string;
  dataFinish: string;
  timeFinish: string;
}

@Injectable({ providedIn: 'root' })
export class AddNewWaybillsService {
  /* ───────── UI STATE ───────── */
  isOpenTruckModalMenu = signal(false);
  isOpenTrailerModalMenu = signal(false);
  isOpenCalendarStartModal = signal(false);
  isOpenCalendarEndModal = signal(false);
  isOpenTimeStartModal = signal(false);
  isOpenTimeEndModal = signal(false);

  /* ───────── VEHICLES ───────── */
  private _vehicleList = signal<any[]>([]);
  vehicleList = computed(() => this._vehicleList()); // read-only for consumers
  currentSelectedVehicle = signal<Vehicle>({ truck: '', trailer: '' });

  /* ───────── NOTES ───────── */
  currentNotes = signal<string>('');

  /* ───────── DATE ───────── */
  private now = new Date();
  private dateFormat = {
    data: `${('0' + this.now.getDate()).slice(-2)} ${MONTHS[this.now.getMonth()].slice(0, 3)} ${this.now.getFullYear()}`,
    time: `${('0' + this.now.getHours()).slice(-2)}:${('0' + this.now.getMinutes()).slice(-2)}`,
  };
  currentDate = signal<WaybillDate>({
    dataStart: this.dateFormat.data,
    timeStart: this.dateFormat.time,
    dataFinish: '',
    timeFinish: '',
  });

  /* ───────── DATA ───────── */
  data: any;

  constructor(
    private fb: FirebaseClientService,
    private alertService: AlertService,
    private location: Location,
    private waybillsService: WaybillsService,
  ) {
    this.refreshVehicles();
  }

  /* ──────────────────────────── */
  /* VEHICLE LIST                 */
  /* ──────────────────────────── */
  async refreshVehicles() {
    const vehicles = await this.fb.getVehicleFleet();
    this._vehicleList.set(vehicles);
    await this.waybillsService.refresh();
  }

  setCurrentSelectedVehicle(key: '' | 'trailer' | 'truck', value: string) {
    this.currentSelectedVehicle.update((v) => ({ ...v, [key]: value }));
  }

  /* ──────────────────────────── */
  /* DATE HANDLING                */
  /* ──────────────────────────── */
  setCurrentDate(key: keyof WaybillDate, value: string) {
    this.currentDate.update((d) => ({ ...d, [key]: value }));
  }

  private formatForSave(isStart: boolean) {
    const d = this.currentDate();
    return isStart
      ? mergeDateTime(d.dataStart, d.timeStart)
      : mergeDateTime(d.dataFinish, d.timeFinish);
  }

  /* ──────────────────────────── */
  /* SAVE WAYBILL                 */
  /* ──────────────────────────── */
  async saveInFB() {
    try {
      const date = this.currentDate();
      const vehicle = this.currentSelectedVehicle();

      if (!date.dataStart || !date.timeStart) {
        return this.alertService.show('error', 'Proszę wybrać datę i godzinę rozpoczęcia');
      }
      if (!vehicle.truck) {
        return this.alertService.show('error', 'Proszę wybrać ciężarówkę');
      }
      if (!date.dataFinish && this.waybillsService.waybills().some((w) => w.dataFinish === '')) {
        return this.alertService.show('error', 'Masz już aktualną kartę drogową!');
      }
      if (!this.waybillsService.checkIfWaybillExistAsync(date.dataStart)) return;

      this.data = {
        dataStart: this.formatForSave(true),
        dataFinish: date.dataFinish ? this.formatForSave(false) : '',
        truck: vehicle.truck,
        trailer: vehicle.trailer,
        notes: this.currentNotes(),
      };

      await this.fb.addInfoForCurrentUser(this.data);

      this.alertService.show('success', 'Karta drogowa została pomyślnie zapisana!');
      this.resetAll();
      await this.waybillsService.checkForUpdates();
      this.location.back();
    } catch (e) {
      this.alertService.show('error', String(e));
    }
  }

  resetAll() {
    this.currentSelectedVehicle.set({ truck: '', trailer: '' });
    this.currentDate.set({
      dataStart: this.dateFormat.data,
      timeStart: this.dateFormat.time,
      dataFinish: '',
      timeFinish: '',
    });
    this.currentNotes.set('');
  }
}
