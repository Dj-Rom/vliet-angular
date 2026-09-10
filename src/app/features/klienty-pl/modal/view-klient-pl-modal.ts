import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KlientPlService, PolishClient } from '../../../core/services/klient-pl.service';

@Component({
  selector: 'app-view-klient-pl-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-klient-pl-modal.html',
  styleUrls: ['./view-klient-pl-modal.css'],
})
export class ViewKlientPlModal {
  smsMessage = signal<string>('');
  isCustomizingSms = signal<boolean>(false);

  constructor(public klientService: KlientPlService) {
    this.smsMessage.set(this.klientService.defaultSmsMessage);
  }

  get item(): PolishClient | null {
    return this.klientService.selectedClient();
  }

  get isOpen(): boolean {
    return this.klientService.isModalOpen();
  }

  back(): void {
    this.isCustomizingSms.set(false);
    this.klientService.closeModal();
  }

  call(): void {
    if (this.item) {
      this.klientService.callClient(this.item);
    }
  }

  sendSms(): void {
    if (this.item) {
      this.klientService.sendArrivalSms(this.item, this.smsMessage());
    }
  }

  toggleSmsEdit(): void {
    this.isCustomizingSms.update((v) => !v);
  }

  navigate(): void {
    if (this.item) {
      this.klientService.navigateClient(this.item);
    }
  }

  copyPhone(): void {
    if (this.item?.telefon) {
      this.klientService.copyToClipboard(this.item.telefon, 'Skopiowano numer telefonu!');
    }
  }

  copyAddress(): void {
    if (this.item?.adres) {
      this.klientService.copyToClipboard(this.item.adres, 'Skopiowano adres!');
    }
  }

  copyGps(): void {
    if (this.item?.gps?.lat && this.item?.gps?.lng) {
      this.klientService.copyToClipboard(
        `${this.item.gps.lat}, ${this.item.gps.lng}`,
        'Skopiowano współrzędne GPS!',
      );
    }
  }
}
