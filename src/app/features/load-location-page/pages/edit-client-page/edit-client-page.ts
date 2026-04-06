import { Component, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Location, NgIf } from '@angular/common';
import { FirebaseClientService, SharedAddress } from '../../../../firebase/firebase.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ActivatedRoute } from '@angular/router';
import { _Alert } from '../../../../shared/alert/alert';

@Component({
  selector: 'app-edit-client-page',
  imports: [FormsModule, NgIf, ReactiveFormsModule],
  templateUrl: './edit-client-page.html',
  styleUrls: [
    './edit-client-page.css',
    '../add-new-client-page/add-new-client-page.css',
    '../../../../../app/features/waybiils/pages/add-new-waybill-page/add-new-waybill-page.css',
  ],
})
export class EditClientPage implements OnInit {
  listAddress = signal<SharedAddress[]>([]);
  addressForEdit = signal<SharedAddress>({
    id: '',
    company: '',
    address: '',
    google_link: '',
    gps: '',
    notes: '',
  });

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

  private id = '';

  constructor(
    private location: Location,
    private fb: FirebaseClientService,
    private alert: AlertService,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    // get id from route
    this.id = this.route.snapshot.paramMap.get('id') ?? '';

    // fetch all addresses
    const addresses = await this.fb.getSharedAddresses();
    this.listAddress.set(addresses);

    // find the address to edit
    const address = addresses.find((a) => a.id === this.id);
    if (address) {
      this.addressForEdit.set(address);

      // update form values
      this.form.patchValue({
        company: address.company,
        address: address.address,
        google_link: address.google_link,
        gps: address.gps,
        notes: address.notes,
      });
    } else {
      this.alert.show('error', 'Address not found');
      this.back();
    }
  }

  back() {
    this.location.back();
  }

  async submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const { company, address, google_link, gps, notes } = this.form.value;

    // update instead of add
    // await this.fb.updateAddress(this.id, {
    //   company: company!,
    //   address: address!,
    //   google_link: google_link!,
    //   gps: gps!,
    //   notes: notes!
    // });

    this.alert.show('success', 'Client updated successfully');
    this.back();
  }
}
