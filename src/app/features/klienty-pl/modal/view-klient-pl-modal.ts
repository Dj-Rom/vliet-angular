import { Component, signal, effect } from '@angular/core';
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
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isGettingGps = signal<boolean>(false);

  // Edit form model
  editKlient = '';
  editTelefon = '';
  editAdres = '';
  editKodKlienta = '';
  editNumer = '';
  editUwagi = '';
  editLat: number | null = null;
  editLng: number | null = null;

  constructor(public klientService: KlientPlService) {
    this.smsMessage.set(this.klientService.defaultSmsMessage);

    // Whenever selectedClient changes, reset edit form
    effect(() => {
      const client = this.klientService.selectedClient();
      if (client) {
        this.resetEditForm(client);
      }
    });
  }

  get item(): PolishClient | null {
    return this.klientService.selectedClient();
  }

  get isOpen(): boolean {
    return this.klientService.isModalOpen();
  }

  private resetEditForm(client: PolishClient): void {
    this.editKlient = client.klient || '';
    this.editTelefon = client.telefon || '';
    this.editAdres = client.adres || '';
    this.editKodKlienta = client.kod_klienta || '';
    this.editNumer = client.numer || '';
    this.editUwagi = client.uwagi || '';
    this.editLat = client.gps?.lat ?? null;
    this.editLng = client.gps?.lng ?? null;
    this.isEditing.set(false);
  }

  back(): void {
    this.isCustomizingSms.set(false);
    this.isEditing.set(false);
    this.klientService.closeModal();
  }

  startEdit(): void {
    if (this.item) {
      this.resetEditForm(this.item);
      this.isEditing.set(true);
    }
  }

  cancelEdit(): void {
    if (this.item) {
      this.resetEditForm(this.item);
    }
    this.isEditing.set(false);
  }

  async saveEdit(): Promise<void> {
    if (!this.item) return;

    this.isSaving.set(true);
    try {
      const updatedData: Partial<PolishClient> = {
        klient: this.editKlient.trim() || null,
        telefon: this.editTelefon.trim() || null,
        adres: this.editAdres.trim() || null,
        kod_klienta: this.editKodKlienta.trim() || null,
        numer: this.editNumer.trim() || null,
        uwagi: this.editUwagi.trim() || null,
        gps:
          this.editLat !== null && this.editLng !== null
            ? { lat: Number(this.editLat), lng: Number(this.editLng) }
            : null,
      };

      await this.klientService.updateClient(this.item.id, updatedData);
      this.isEditing.set(false);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteClient(): Promise<void> {
    if (!this.item) return;
    if (confirm(`Czy na pewno chcesz usunąć klienta: "${this.item.klient || this.item.kod_klienta}"?`)) {
      await this.klientService.deleteClient(this.item.id);
    }
  }

  /* ================= GPS ACTIONS ================= */

  async captureCurrentGps(): Promise<void> {
    if (!this.item) return;
    this.isGettingGps.set(true);
    try {
      const coords = await this.klientService.captureDeviceGpsForClient(this.item);
      this.editLat = coords.lat;
      this.editLng = coords.lng;
    } catch {
      // Error handled by alert in service
    } finally {
      this.isGettingGps.set(false);
    }
  }

  async captureCurrentGpsForEdit(): Promise<void> {
    if (!navigator.geolocation) {
      alert('Geolokalizacja nie jest obsługiwana przez urządzenie');
      return;
    }
    this.isGettingGps.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.editLat = parseFloat(pos.coords.latitude.toFixed(6));
        this.editLng = parseFloat(pos.coords.longitude.toFixed(6));
        this.isGettingGps.set(false);
      },
      (err) => {
        this.isGettingGps.set(false);
        alert(`Błąd GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  /* ================= COMMON ACTIONS ================= */

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
