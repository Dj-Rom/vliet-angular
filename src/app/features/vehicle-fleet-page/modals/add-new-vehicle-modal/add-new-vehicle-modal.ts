import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';

import { FirebaseClientService } from '../../../../firebase/firebase.service';
import { AlertService } from '../../../../core/services/alert.service';
import { VehicleFleetService } from '../../../../core/services/vehicle-fleet.service';
import { AddNewWaybillsService } from '../../../waybiils/services/add-new-waybills.service';
import { _VehicleFleet } from '../../../../../interfaces';

@Component({
  selector: 'app-add-new-vehicle',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './add-new-vehicle-modal.html',
  styleUrls: ['./add-new-vehicle-modal.css'],
})
export class AddNewVehicleModal {
  @Output() close = new EventEmitter<void>();
  vehicleForm: FormGroup;
  isTrailer = false;
  vehicleFleet: _VehicleFleet[] = [];

  constructor(
    private fb: FormBuilder,
    private firebase: FirebaseClientService,
    private alertService: AlertService,
    private vehicleFleetService: VehicleFleetService,
    private addNewWaybillsService: AddNewWaybillsService,
  ) {
    this.vehicleForm = this.fb.group({
      vehicleType: ['truck', Validators.required],
      vehicleBrand: ['volvo'],
      vehicleTrailerBrand: ['schmitz'],
      vehicleNumber: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /* ──────────────────────────── */
  /* TYPE SWITCH                  */
  /* ──────────────────────────── */

  onTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.isTrailer = value === 'trailer';
  }

  /* ──────────────────────────── */
  /* SUBMIT                       */
  /* ──────────────────────────── */

  async onSubmit() {
    if (this.vehicleForm.invalid) {
      this.alertService.show('error', 'Form invalid');
      return;
    }

    try {
      this.vehicleFleet = await this.vehicleFleetService.getVehicleFleet();

      const { vehicleType, vehicleBrand, vehicleTrailerBrand, vehicleNumber } =
        this.vehicleForm.value;

      const normalizedNumber = vehicleNumber.toUpperCase();

      if (this.vehicleFleet.some((v) => v.vehicle_number === normalizedNumber)) {
        this.alertService.show('error', 'Vehicle already exists');
        return;
      }

      await this.firebase.addVehicleFleet(
        normalizedNumber,
        vehicleType,
        this.isTrailer ? vehicleTrailerBrand : vehicleBrand,
      );

      /* 🔄 refresh vehicle list everywhere */
      await this.addNewWaybillsService.refreshVehicles();

      this.alertService.show('success', 'Pojazd dodany pomyślnie');
      this.vehicleForm.reset({ vehicleType: 'truck' });
      this.close.emit();
    } catch (err) {
      this.alertService.show('error', String(err));
    }
  }

  /* ──────────────────────────── */
  /* CLOSE                        */
  /* ──────────────────────────── */

  back() {
    this.close.emit();
  }
}
