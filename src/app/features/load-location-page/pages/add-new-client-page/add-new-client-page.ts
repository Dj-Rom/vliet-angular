import { Component } from '@angular/core';
import {
  FormControl,
  FormControlName,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Location, NgIf } from '@angular/common';
import { FirebaseClientService } from '../../../../firebase/firebase.service';
import { AlertService } from '../../../../core/services/alert.service';
import { _Alert } from '../../../../shared/alert/alert';
import { LoadLocation } from '../../load-location';
import { LoadLocationService } from '../../../../core/services/load-location.service';
@Component({
  selector: 'app-add-new-client-page',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './add-new-client-page.html',
  styleUrls: [
    './add-new-client-page.css',
    '../../../../../app/features/waybiils/pages/add-new-waybill-page/add-new-waybill-page.css',
  ],
})
export class AddNewClientPage {
  form = new FormGroup({
    company: new FormControl('', [Validators.required, Validators.minLength(2)]),
    address: new FormControl('', [Validators.required]),
    google_link: new FormControl('', [Validators.required, Validators.pattern(/https?:\/\/.+/)]),
    gps: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/),
    ]),
    notes: new FormControl(''),
  });

  constructor(
    private location: Location,
    private fb: FirebaseClientService,
    private alert: AlertService,
    private loadLocationService: LoadLocationService,
  ) {}

  back() {
    this.location.back();
  }

  submit() {
    if (this.form.valid) {
      const { company, address, google_link, gps, notes } = this.form.value;
      this.fb.addAddress(company!, address!, google_link!, gps!, notes!).then(async () => {
        this.alert.show('success', 'Client added successfully');
        await this.loadLocationService.checkForUpdates();
        this.back();
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
