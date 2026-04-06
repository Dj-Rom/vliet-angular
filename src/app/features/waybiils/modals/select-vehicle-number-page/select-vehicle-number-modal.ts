import { Component, signal } from '@angular/core';
import { AddNewWaybillsService } from '../../services/add-new-waybills.service';
import { EditWaybillService } from '../../services/edit-waybill.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Router } from '@angular/router';
import { AddNewVehicleModal } from '../../../vehicle-fleet-page/modals/add-new-vehicle-modal/add-new-vehicle-modal';
import { NgIf } from '@angular/common';
import { WaybillsService } from '../../services/waybills.service';

@Component({
  selector: 'app-select-vehicle-number-page',
  imports: [AddNewVehicleModal, NgIf],
  standalone: true,
  templateUrl: './select-vehicle-number-modal.html',
  styleUrl: './select-vehicle-number-modal.css',
})
export class SelectVehicleNumberModal {
  protected vehicleFleetList: any;
  filterValue = signal('');
  currentType: '' | 'trailer' | 'truck' = '';
  vehicleFleetFiltered;

  constructor(
    private addNewWaybillsService: AddNewWaybillsService,
    private editWaybillsService: EditWaybillService,
    private alert: AlertService,
    protected waybillsService: WaybillsService,
  ) {
    this.vehicleFleetList = this.addNewWaybillsService.vehicleList();
    if (
      this.editWaybillsService.isOpenEditTrailerModalMenu() ||
      this.editWaybillsService.isOpenEditTruckModalMenu()
    ) {
      this.currentType = this.editWaybillsService.isOpenEditTrailerModalMenu()
        ? 'trailer'
        : 'truck';
    } else {
      this.currentType = this.addNewWaybillsService.isOpenTruckModalMenu()
        ? 'truck'
        : this.addNewWaybillsService.isOpenTrailerModalMenu()
          ? 'trailer'
          : '';
    }

    this.vehicleFleetFiltered = this.vehicleFleetList.filter(
      (item: any) => item.type === this.currentType,
    );
  }

  protected onFilter($event: Event) {
    const value = event?.target as HTMLInputElement;
    this.filterValue.set(value.value.toUpperCase());
    this.vehicleFleetFiltered = this.vehicleFleetList.filter((item: any) =>
      item.vehicle_number.includes(this.filterValue()),
    );
  }

  clearFilter() {
    this.filterValue.set('');
    this.vehicleFleetFiltered = this.vehicleFleetList.filter(
      (item: any) => item.type === this.currentType,
    );
  }

  protected selectNumber(event: Event) {
    const el = event.currentTarget as HTMLElement;
    const value = el.innerText.trim();

    if (!value) {
      this.alert.show('error', 'Nie można wybrać numeru');
      return;
    }

    if (!this.editWaybillsService.id()) {
      this.addNewWaybillsService.setCurrentSelectedVehicle(this.currentType, value);
    } else {
      this.editWaybillsService.setCurrentSelectedVehicle(this.currentType, value);
    }

    this.closeModal();
  }

  protected closeModal() {
    if (this.currentType === 'truck') {
      this.addNewWaybillsService.isOpenTruckModalMenu.set(false);
      this.editWaybillsService.isOpenEditTruckModalMenu.set(false);
    }
    this.addNewWaybillsService.isOpenTrailerModalMenu.set(false);
    this.editWaybillsService.isOpenEditTrailerModalMenu.set(false);
    this.editWaybillsService.id.set(undefined);
  }

  protected addNewVehicle() {
    this.waybillsService.isOpenModalFormForAddNewVehicle.set(true);
  }
}
