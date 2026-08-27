import { Component, computed, OnInit, signal } from '@angular/core';
import { Calendar } from '../../component/calendar/calendar';
import { NgIf } from '@angular/common';
import { SelectVehicleNumberModal } from '../../modals/select-vehicle-number-page/select-vehicle-number-modal';
import { TimePickerComponent } from '../../component/time-picker/time-picker';
import { AlertService } from '../../../../core/services/alert.service';
import { Location } from '@angular/common';
import { EditWaybillService } from '../../services/edit-waybill.service';
import { WaybillsService } from '../../services/waybills.service';
import { Router, Routes } from '@angular/router';
import { _Alert } from '../../../../shared/alert/alert';
import { AddNewWaybillsService } from '../../services/add-new-waybills.service';
import { formatToYYYYMMDD } from '../../../../helpers/formatDateTime';

@Component({
  selector: 'app-edit-waybills-page',
  imports: [Calendar, NgIf, SelectVehicleNumberModal, TimePickerComponent],
  templateUrl: './edit-waybills-page.html',
  styleUrl: './edit-waybills-page.css',
})
export class EditWaybillsPage implements OnInit {
  id = '';

  constructor(
    protected editWaybillService: EditWaybillService,
    private alert: AlertService,
    private location: Location,
    private waybillsService: WaybillsService,
    private router: Router,
    private addNewWaybillsService: AddNewWaybillsService,
  ) {
    this.ngOnInit();
  }

  async ngOnInit() {
    this.id = this.router.routerState.snapshot.url!.split('/')[4];
    await this.editWaybillService.init();
    this.addNewWaybillsService.vehicleList();
  }

  onOpenTruckModalMenu() {
    this.editWaybillService.isOpenEditTruckModalMenu.set(true);
  }

  onOpenTrailerModalMenu() {
    this.editWaybillService.isOpenEditTrailerModalMenu.set(true);
  }

  onOpenCalendarModal(timeType: string) {
    if (timeType === 'start') {
      this.editWaybillService.isOpenEditCalendarStartModal.update((v) => !v);
      this.editWaybillService.isOpenEditCalendarEndModal.set(false);
    } else {
      this.editWaybillService.isOpenEditCalendarEndModal.update((v) => !v);
      this.editWaybillService.isOpenEditCalendarStartModal.set(false);
    }
    this.editWaybillService.isOpenEditTimeStartModal.set(false);
    this.editWaybillService.isOpenEditTimeEndModal.set(false);
  }

  onOpenTimeModal(timeType: string) {
    if (timeType === 'start') {
      this.editWaybillService.isOpenEditTimeStartModal.update((v) => !v);
      this.editWaybillService.isOpenEditTimeEndModal.set(false);
    } else {
      this.editWaybillService.isOpenEditTimeEndModal.update((v) => !v);
      this.editWaybillService.isOpenEditTimeStartModal.set(false);
    }
    this.editWaybillService.isOpenEditCalendarStartModal.set(false);
    this.editWaybillService.isOpenEditCalendarEndModal.set(false);
  }

  addNewWaybills() {
    if (!this.editWaybillService.getCurrentSelectedVehicle().truck) {
      this.alert.show('error', 'Proszę wybrać ciężarówkę');
    } else if (
      !!this.editWaybillService.getCurrentDate()().dataFinish &&
      new Date(formatToYYYYMMDD(this.editWaybillService.getCurrentDate()().dataFinish)) <
        new Date(formatToYYYYMMDD(this.editWaybillService.getCurrentDate()().dataStart))
    ) {
      this.alert.show('error', 'Data końcowa nie może być wcześniejsza niż data początkowa.');
    } else if (
      !!this.editWaybillService.getCurrentSelectedVehicle().truck &&
      !!this.editWaybillService.currentDate().dataStart
    ) {
      this.editWaybillService.saveInFB();
      this.waybillsService.refresh();
    }
  }

  protected back() {
    this.location.back();
  }
}
