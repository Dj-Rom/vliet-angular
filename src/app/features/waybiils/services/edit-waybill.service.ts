
import { computed, Injectable, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FirebaseClientService } from '../../../firebase/firebase.service';
import { AlertService } from '../../../core/services/alert.service';
import { WaybillsService } from './waybills.service';
import { MONTHS } from '../component/calendar/calendar';
import { _Vehicle, _WayBill, _VehicleFleet } from '../../../../interfaces';
import { formatToYYYYMMDD } from '../../../helpers/formatDateTime';

@Injectable({
  providedIn: 'root',
})
export class EditWaybillService {
  // ===== MODALS =====
  isOpenEditTruckModalMenu = signal(false);
  isOpenEditTrailerModalMenu = signal(false);
  isOpenEditCalendarStartModal = signal(false);
  isOpenEditCalendarEndModal = signal(false);
  isOpenEditTimeStartModal = signal(false);
  isOpenEditTimeEndModal = signal(false);

  // ===== DATA =====
  listVehicle: _VehicleFleet[] = [];
  currentNotes = signal('');

  id = signal<string | undefined>(undefined);

  // ===== CURRENT )DATE STATE =====
  currentDate = signal({
    dataStart: '',
    timeStart: '',
    dataFinish: '',
    timeFinish: '',
  });

  // ===== CURRENT VEHICLE =====
  currentSelectedVehicle = {
    truck: '',
    trailer: '',
  };
  bill: _WayBill | undefined;

  constructor(
    private fb: FirebaseClientService,
    private alertService: AlertService,
    private location: Location,
    private waybillsService: WaybillsService,
  ) {
    this.init();
  }

  setCurrentSelectedVehicle(key: 'truck' | 'trailer' | '', value: string) {
    if (key === '') return;
    this.currentSelectedVehicle[key] = value;
  }

  dateFormat(date: any) {
    if (!date.date) return '';
    const d = date.date.split('-');
    return `${d[2]} ${MONTHS[+d[1] - 1].slice(0, 3)} ${d[0]}`;
  }

  async init() {
    this.id.set(this.location.path().split('/')[4]);
    await this.getVehicleFleetAndWaybills();
    this.bill = await this.waybillsService.getWaybillById(this.id()!);

    if (this.bill == undefined) return;

    const start = this.splitDateTime(this.bill.dataStart);
    const finish = this.splitDateTime(this.bill?.dataFinish);

    this.currentDate.set({
      dataStart: this.dateFormat(start),
      timeStart: start.time,
      dataFinish: this.dateFormat(finish),
      timeFinish: finish.time,
    });

    this.currentSelectedVehicle = {
      truck: this.bill!.truck,
      trailer: this.bill!.trailer,
    };

    this.currentNotes.set(this.bill?.notes || '');
  }

  // ===== FETCH DATA =====
  async getVehicleFleetAndWaybills() {
    this.listVehicle = await this.fb.getVehicleFleet();

    const filtered = computed(() =>
      this.waybillsService.waybills().filter((w) => w.id === this.id()),
    );
  }

  // ===== HELPERS =====
  private splitDateTime(value?: string) {
    if (!value || !value.includes('T')) {
      return { date: '', time: '' };
    }

    const [date, time] = value.split('T');
    return { date, time };
  }

  private mergeDateTime(date: string, time: string) {
    if (!date || !time) return '';
    return `${date}T${time}`;
  }

  // ===== GETTERS =====
  getCurrentDate() {
    return this.currentDate;
  }

  getCurrentSelectedVehicle(): _Vehicle {
    return this.currentSelectedVehicle;
  }

  formatForSaveDateFBDb(isStart: boolean) {
    return isStart
      ? this.mergeDateTime(this.currentDate().dataStart, this.currentDate().timeStart)
      : this.mergeDateTime(this.currentDate().dataFinish, this.currentDate().timeFinish);
  }

  // ===== SAVE =====
  saveInFB() {
    const current = this.getCurrentDate();

    const data = {
      dataStart: this.mergeDateTime(formatToYYYYMMDD(current().dataStart), current().timeStart),
      dataFinish: this.mergeDateTime(formatToYYYYMMDD(current().dataFinish), current().timeFinish),
      truck: this.currentSelectedVehicle.truck,
      trailer: this.currentSelectedVehicle.trailer,
      notes: this.currentNotes(),
    };

    if (!this.bill?.id) return;

    this.fb
      .updateWayBillsHistory(this.bill?.id, data)
      .then(() => {
        this.alertService.show('success', 'List przewozowy został pomyślnie zapisany');
        this.waybillsService.refresh();
        this.resetAll();
        this.location.back();
      })
      .catch(() => {
        this.alertService.show('error', 'Błąd podczas zapisywania listu przewozowego');
      });
  }

  resetAll() {
    this.currentSelectedVehicle = { trailer: '', truck: '' };

    this.currentDate.set({
      dataStart: this.dateFormat(this.splitDateTime(this.bill!.dataStart)),
      timeStart: this.splitDateTime(this.bill!.dataStart).time,
      dataFinish: '',
      timeFinish: '',
    });

    this.currentNotes.set('');
  }
}
