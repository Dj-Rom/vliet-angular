import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {FirebaseClientService} from '../../../firebase/firebase.service';
import {AlertService} from '../../../services/alert.service';
import {VehicleFleet} from '../vehicle-fleet';
import {_VehicleFleet} from '../../../data/vehicle-fleet-number';
import {VehicleFleetService} from '../vehicle-fleet.service';
import {Waybill} from '../../waybill/waybill';


@Component({
  selector: 'app-add-new-vehicle',
  templateUrl: './add-new-vehicle.html',
  imports: [
    ReactiveFormsModule,
    NgIf
  ],
  styleUrls: ['./add-new-vehicle.css']
})
export class AddNewVehicle {
  isOpen: boolean = false;
  vehicleForm: FormGroup;
  curentType = false; // false = truck, true = trailer
vehicleFleetArray: _VehicleFleet[] = [];
  constructor(private fb: FormBuilder
    , private firebase: FirebaseClientService,
              private alertService: AlertService,
              private vehicleFleetService: VehicleFleetService,
              private waybill: Waybill
  ) {

    this.vehicleForm = this.fb.group({
      vehicleBrand: ['volvo', Validators.required],
      vehicleType: ['truck', Validators.required],
      vehicleTrailerBrand: ['schmitz', Validators.required],
      vehicleNumber: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.curentType = value === 'trailer';
  }

  async onSubmit() {


    this.vehicleFleetArray = await this.vehicleFleetService.getVehicleFleet();
    if (this.vehicleForm.valid) {
      const {vehicleBrand, vehicleType, vehicleTrailerBrand, vehicleNumber} = this.vehicleForm.value;

      if (this.vehicleFleetArray.find(vehicle => vehicle.vehicle_number == vehicleNumber.toUpperCase())) {
        this.alertService.show('error', 'Vehicle already exists');
        console.log('Vehicle already exists');
        return
      }else{
        if (this.curentType) {
          await this.firebase.addVehicleFleet(
            vehicleNumber.toUpperCase(),
            vehicleType,
            vehicleTrailerBrand,
          )
        } else {
          await this.firebase.addVehicleFleet(
            vehicleNumber.toUpperCase(),
            vehicleType,
            vehicleBrand)

        }
        this.vehicleForm.get('vehicleNumber')?.reset();

        this.alertService.show('success', 'Vehicle added successfully');
      }



    } else {
      console.log(this.vehicleForm.errors);
      this.alertService.show('error','Form invalid');
    }
    this.waybill.setIsOpenModalFormForAddNewVehicle()
  }
}
