import { Component, computed, signal } from '@angular/core';
import { AddNewWaybillsService } from '../../services/add-new-waybills.service';
import { EditWaybillService } from '../../services/edit-waybill.service';
import { AlertService } from '../../../../core/services/alert.service';
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
  filterValue = signal('');
  currentType: '' | 'trailer' | 'truck' = '';

  vehicleFleetFiltered = computed(() => {
    const list = this.addNewWaybillsService.vehicleList() || [];
    const filter = this.filterValue().trim().toUpperCase();
    const type = this.currentType;

    return list.filter((item: any) => {
      const matchesType = !type || (item.type || '').toLowerCase() === type.toLowerCase();
      const matchesFilter = !filter || (item.vehicle_number || '').toUpperCase().includes(filter);
      return matchesType && matchesFilter;
    });
  });

  constructor(
    private addNewWaybillsService: AddNewWaybillsService,
    private editWaybillsService: EditWaybillService,
    private alert: AlertService,
    protected waybillsService: WaybillsService,
  ) {
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

    if (!this.addNewWaybillsService.vehicleList()?.length) {
      this.addNewWaybillsService.refreshVehicles();
    }
  }

  protected onFilter($event: Event) {
    const value = $event?.target as HTMLInputElement;
    this.filterValue.set(value?.value || '');
  }

  clearFilter() {
    this.filterValue.set('');
  }

  protected selectNumber(value: string) {
    const trimmed = (value || '').trim();

    if (!trimmed) {
      this.alert.show('error', 'Nie można wybrać numeru');
      return;
    }

    if (!this.editWaybillsService.id()) {
      this.addNewWaybillsService.setCurrentSelectedVehicle(this.currentType, trimmed);
    } else {
      this.editWaybillsService.setCurrentSelectedVehicle(this.currentType, trimmed);
    }

    this.closeModal();
  }

  protected closeModal() {
    if (this.currentType === 'truck') {
      this.addNewWaybillsService.isOpenTruckModalMenu.set(false);
      this.editWaybillsService.isOpenEditTruckModalMenu.set(false);
    } else if (this.currentType === 'trailer') {
      this.addNewWaybillsService.isOpenTrailerModalMenu.set(false);
      this.editWaybillsService.isOpenEditTrailerModalMenu.set(false);
    } else {
      this.addNewWaybillsService.isOpenTruckModalMenu.set(false);
      this.editWaybillsService.isOpenEditTruckModalMenu.set(false);
      this.addNewWaybillsService.isOpenTrailerModalMenu.set(false);
      this.editWaybillsService.isOpenEditTrailerModalMenu.set(false);
    }
    this.editWaybillsService.id.set(undefined);
  }

  protected addNewVehicle() {
    this.waybillsService.isOpenModalFormForAddNewVehicle.set(true);
  }

  /**
   * Called when the add-new-vehicle modal closes.
   * If a vehicle number was emitted (successful save), auto-select it.
   */
  protected onNewVehicleAdded(vehicleNumber: string) {
    this.waybillsService.isOpenModalFormForAddNewVehicle.set(false);
    if (vehicleNumber) {
      this.selectNumber(vehicleNumber);
    }
  }
}
