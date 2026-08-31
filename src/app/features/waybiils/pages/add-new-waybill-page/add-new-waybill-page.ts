import { Component } from '@angular/core';
import { AddNewWaybillsService } from '../../services/add-new-waybills.service';
import { SelectVehicleNumberModal } from '../../modals/select-vehicle-number-page/select-vehicle-number-modal';
import { NgIf } from '@angular/common';
import { Calendar } from '../../component/calendar/calendar';
import { TimePickerComponent } from '../../component/time-picker/time-picker';
import { AlertService } from '../../../../core/services/alert.service';
import { Location } from '@angular/common';
import { WaybillsService } from '../../services/waybills.service';
import { _Alert } from '../../../../shared/alert/alert';
import { formatToYYYYMMDD } from '../../../../helpers/formatDateTime';

@Component({
  selector: 'app-add-new-waybill-page',
  imports: [SelectVehicleNumberModal, NgIf, Calendar, TimePickerComponent],
  templateUrl: './add-new-waybill-page.html',
  styleUrl: './add-new-waybill-page.css',
})
export class AddNewWaybillPage {
  constructor(
    protected addNewWaybillsService: AddNewWaybillsService,
    private alert: AlertService,
    private location: Location,
    private waybillsService: WaybillsService,
  ) { }

  onOpenTruckModalMenu() {
    this.addNewWaybillsService.isOpenTruckModalMenu.set(true);
  }

  onOpenTrailerModalMenu() {
    this.addNewWaybillsService.isOpenTrailerModalMenu.set(true);
  }

  onOpenCalendarModal(timeType: string) {
    this.addNewWaybillsService.isOpenTimeStartModal.set(false);
    this.addNewWaybillsService.isOpenTimeEndModal.set(false);
    if (timeType === 'start') {
      this.addNewWaybillsService.isOpenCalendarStartModal.update((v) => !v);
      this.addNewWaybillsService.isOpenCalendarEndModal.set(false);
    } else {
      this.addNewWaybillsService.isOpenCalendarStartModal.set(false);
      this.addNewWaybillsService.isOpenCalendarEndModal.update((v) => !v);
    }
  }

  onOpenTimeModal(timeType: string) {
    this.addNewWaybillsService.isOpenCalendarStartModal.set(false);
    this.addNewWaybillsService.isOpenCalendarEndModal.set(false);

    if (timeType === 'start') {
      this.addNewWaybillsService.isOpenTimeStartModal.update((v) => !v);
      this.addNewWaybillsService.isOpenTimeEndModal.set(false);
    } else {
      this.addNewWaybillsService.isOpenTimeStartModal.set(false);
      this.addNewWaybillsService.isOpenTimeEndModal.update((v) => !v);
    }
  }

  addNewWaybills() {
    if (
      !!this.addNewWaybillsService.currentDate().dataFinish &&
      new Date(formatToYYYYMMDD(this.addNewWaybillsService.currentDate().dataStart)) >
      new Date(formatToYYYYMMDD(this.addNewWaybillsService.currentDate().dataFinish))
    ) {
      return this.alert.show('error', 'Data rozpoczęcia jest późniejsza niż data zakończenia');
    }
    if (
      !this.addNewWaybillsService.currentDate().timeFinish &&
      !!this.addNewWaybillsService.currentDate().dataFinish
    ) {
      return this.alert.show(
        'error',
        'Jeśli wprowadziłem datę zakończenia, musisz wprowadzić godzinę zakończenia.',
      );
    }

    if (!this.addNewWaybillsService.currentSelectedVehicle().truck) {
      return this.alert.show('error', 'Proszę wybrać ciągnik');
    }

    if (!this.addNewWaybillsService.currentSelectedVehicle().trailer) {
      return this.alert.show('error', 'Proszę wybrać naczepę');
    }

    this.addNewWaybillsService.saveInFB();
    this.waybillsService.refresh();
  }

  protected back() {
    this.location.back();
  }

  protected closeAddNewWaybill() {
    this.addNewWaybillsService.resetAll();
    this.back();
  }
}
