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
  // защита от повторного/параллельного сохранения
  private isSaving = false;

  currentDate = signal<WaybillDate>(this.getCurrentWaybillDate());

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
  /* DATE HELPERS                 */
  /* ──────────────────────────── */

  /**
   * Возвращает свежую дату/время старта (локальное время пользователя),
   * вычисленное на момент вызова, а не "запечённое" при старте сервиса.
   */
  private getCurrentWaybillDate(): WaybillDate {
    try {
      const now = new Date();

      if (isNaN(now.getTime())) {
        throw new Error('Invalid Date instance');
      }

      const monthIndex = now.getMonth();
      const monthName = MONTHS[monthIndex]?.slice(0, 3) ?? String(monthIndex + 1).padStart(2, '0');

      const data = `${String(now.getDate()).padStart(2, '0')} ${monthName} ${now.getFullYear()}`;
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      return {
        dataStart: data,
        timeStart: time,
        dataFinish: '',
        timeFinish: '',
      };
    } catch (e) {
      console.error('AddNewWaybillsService: getCurrentWaybillDate failed:', e);
      return {
        dataStart: '',
        timeStart: '',
        dataFinish: '',
        timeFinish: '',
      };
    }
  }

  /* ──────────────────────────── */
  /* VEHICLE LIST                 */
  /* ──────────────────────────── */
  async refreshVehicles() {
    try {
      const vehicles = await this.fb.getVehicleFleet();
      this._vehicleList.set(Array.isArray(vehicles) ? vehicles : []);
      await this.waybillsService.refresh();
    } catch (e) {
      console.error('AddNewWaybillsService: refreshVehicles failed:', e);
      this._vehicleList.set([]);
      this.alertService.show('error', 'Nie udało się załadować listy pojazdów');
    }
  }

  setCurrentSelectedVehicle(key: '' | 'trailer' | 'truck', value: string) {
    if (!key) {
      console.warn('AddNewWaybillsService: setCurrentSelectedVehicle called with empty key');
      return;
    }
    this.currentSelectedVehicle.update((v) => ({ ...v, [key]: value ?? '' }));
  }

  /* ──────────────────────────── */
  /* DATE HANDLING                */
  /* ──────────────────────────── */
  setCurrentDate(key: keyof WaybillDate, value: string) {
    if (!key) {
      console.warn('AddNewWaybillsService: setCurrentDate called with empty key');
      return;
    }
    this.currentDate.update((d) => ({ ...d, [key]: value ?? '' }));
  }

  private formatForSave(isStart: boolean): string {
    try {
      const d = this.currentDate();
      const result = isStart
        ? mergeDateTime(d.dataStart, d.timeStart)
        : mergeDateTime(d.dataFinish, d.timeFinish);

      return result ?? '';
    } catch (e) {
      console.error('AddNewWaybillsService: formatForSave failed:', e);
      return '';
    }
  }

  /* ──────────────────────────── */
  /* SAVE WAYBILL                 */
  /* ──────────────────────────── */
  async saveInFB() {
    // защита от двойного клика / параллельного вызова сохранения
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;

    try {
      const date = this.currentDate();
      const vehicle = this.currentSelectedVehicle();

      if (!date?.dataStart || !date?.timeStart) {
        this.alertService.show('error', 'Proszę wybrać datę i godzinę rozpoczęcia');
        return;
      }
      if (!vehicle?.truck) {
        this.alertService.show('error', 'Proszę wybrać ciężarówkę');
        return;
      }

      const existingWaybills = this.waybillsService.waybills();
      if (!date.dataFinish && Array.isArray(existingWaybills) && existingWaybills.some((w) => w.dataFinish === '')) {
        this.alertService.show('error', 'Masz już aktualną kartę drogową!');
        return;
      }

      const canProceed = await this.waybillsService.checkIfWaybillExistAsync(date.dataStart);
      if (!canProceed) return;

      const formattedStart = this.formatForSave(true);
      if (!formattedStart) {
        this.alertService.show('error', 'Nieprawidłowa data lub godzina rozpoczęcia');
        return;
      }

      const formattedFinish = date.dataFinish ? this.formatForSave(false) : '';
      if (date.dataFinish && !formattedFinish) {
        this.alertService.show('error', 'Nieprawidłowa data lub godzina zakończenia');
        return;
      }

      this.data = {
        dataStart: formattedStart,
        dataFinish: formattedFinish,
        truck: vehicle.truck,
        trailer: vehicle.trailer ?? '',
        notes: this.currentNotes() ?? '',
      };

      await this.fb.addInfoForCurrentUser(this.data);

      this.alertService.show('success', 'Karta drogowa została pomyślnie zapisana!');
      this.resetAll();
      await this.waybillsService.checkForUpdates();
      this.location.back();
    } catch (e) {
      console.error('AddNewWaybillsService: saveInFB failed:', e);
      this.alertService.show('error', this.getErrorMessage(e));
    } finally {
      this.isSaving = false;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Nieznany błąd';
    }
  }

  resetAll() {
    try {
      this.currentSelectedVehicle.set({ truck: '', trailer: '' });
      this.currentDate.set(this.getCurrentWaybillDate());
      this.currentNotes.set('');
    } catch (e) {
      console.error('AddNewWaybillsService: resetAll failed:', e);
    }
  }
}