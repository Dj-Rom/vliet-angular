import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class AddNewVehicleModal implements OnInit {
  @Input() initialType: 'truck' | 'trailer' | '' = 'truck';
  @Output() closeModal = new EventEmitter<string>();
  vehicleForm: FormGroup;
  isTrailer = false;
  isSubmitting = false;
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

  ngOnInit() {
    if (this.initialType === 'trailer') {
      this.isTrailer = true;
      this.vehicleForm.patchValue({
        vehicleType: 'trailer',
      });
    } else {
      this.isTrailer = false;
      this.vehicleForm.patchValue({
        vehicleType: 'truck',
      });
    }
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

  async onSubmitAddNewVehicle() {
    console.log('submit');
    if (this.vehicleForm.invalid) {
      this.alertService.show('error', 'Form invalid');
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      this.vehicleFleet = await this.vehicleFleetService.getVehicleFleet();

      const { vehicleType, vehicleBrand, vehicleTrailerBrand, vehicleNumber } =
        this.vehicleForm.value;

      const normalizedNumber = (vehicleNumber || '').trim().toUpperCase();

      if (!normalizedNumber) {
        this.alertService.show('error', 'Proszę wpisać numer pojazdu');
        return;
      }

      const vehicleExists = this.vehicleFleet.some(
        (v) => (v.vehicle_number || '').trim().toUpperCase() === normalizedNumber,
      );

      if (vehicleExists) {
        this.alertService.show('error', 'Pojazd o tym numerze już istnieje');
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
      this.vehicleForm.reset({ vehicleType: this.isTrailer ? 'trailer' : 'truck' });
      this.closeModal.emit(normalizedNumber);
    } catch (err) {
      this.alertService.show('error', String(err));
    } finally {
      this.isSubmitting = false;
    }
  }

  /* ──────────────────────────── */
  /* CLOSE                        */
  /* ──────────────────────────── */

  back() {
    this.closeModal.emit('');
  }
}
