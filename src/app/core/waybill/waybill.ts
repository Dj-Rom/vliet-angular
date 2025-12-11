import { Component, OnInit } from '@angular/core';
import { VehicleFleetService } from '../vehicle-fleet/vehicle-fleet.service';
import { _VehicleFleet } from '../../data/vehicle-fleet-number';
import { FirebaseClientService } from '../../firebase/firebase.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import {AlertService} from '../../services/alert.service';
import {AddNewVehicle} from '../vehicle-fleet/add-new-vehicle/add-new-vehicle';

export type VehicleFleetList = {
  trucks: _VehicleFleet[],
  trailers: _VehicleFleet[],
};

@Component({
  selector: 'app-waybill',
  templateUrl: './waybill.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AddNewVehicle
  ],
  styleUrls: ['./waybill.css']
})
export class Waybill implements OnInit {
  vehicleFleetList: VehicleFleetList = { trucks: [], trailers: [] };
  form: FormGroup;
isOpenModalFormForAddNewVehicle = false;
  constructor(
    private alertService: AlertService,
    private vehicleFleetService: VehicleFleetService,
    private fb: FirebaseClientService,
    private formBuilder: FormBuilder
  ) {

    this.form = this.formBuilder.group({
      dataStart: ['', [Validators.required]],
      dataFinish: ['', [Validators.required]],
      truck: ['', Validators.required],
      trailer: ['', Validators.required],
      notes: [''],
    }, {
      validators: this.finishAfterStartValidator
    });
  }

  async ngOnInit(): Promise<void> {

    const res = await this.vehicleFleetService.loadVehicleFleet();
    res.forEach(element => {
      if (element.type === 'truck') {
        this.vehicleFleetList.trucks.push(element);
      } else {
        this.vehicleFleetList.trailers.push(element);
      }
    });

    this.form.patchValue({
      truck: this.vehicleFleetList.trucks[0]?.vehicle_number || '',
      trailer: this.vehicleFleetList.trailers[0]?.vehicle_number || ''
    });

    console.log('Vehicle list:', this.vehicleFleetList);
  }


  finishAfterStartValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('dataStart')?.value;
    const finish = group.get('dataFinish')?.value;

    if (!start || !finish) return null;

    const startDate = new Date(start);
    const finishDate = new Date(finish);

    if (finishDate < startDate) {
      return { finishBeforeStart: true };
    }

    return null;
  }

  onSubmit() {
    if (this.form.valid) {



      this.fb.addInfoForCurrentUser(this.form.value)
        .then(() => {
          this.alertService.show('success','Waybill saved successfully');
          this.form.reset();
        })
        .catch(() => {
          this.alertService.show('error', 'Error saving waybill:');
        });

    } else {
      this.alertService.show('error',`Form invalid ${this.form.errors}`);
      this.form.markAllAsTouched();
    }
  }


  get dataStart() { return this.form.get('dataStart'); }
  get dataFinish() { return this.form.get('dataFinish'); }
  get truck() { return this.form.get('truck'); }
  get trailer() { return this.form.get('trailer'); }
setIsOpenModalFormForAddNewVehicle() {
  this.isOpenModalFormForAddNewVehicle = !this.isOpenModalFormForAddNewVehicle;
}
  addTrailer(event: any) {
    if(event === 'add'){
      this.isOpenModalFormForAddNewVehicle=true;
    }
  }
}
