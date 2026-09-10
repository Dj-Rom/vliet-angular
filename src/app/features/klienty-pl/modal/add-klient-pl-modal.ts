import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KlientPlService, PolishClient } from '../../../core/services/klient-pl.service';

@Component({
  selector: 'app-add-klient-pl-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-klient-pl-modal.html',
  styleUrls: ['./add-klient-pl-modal.css'],
})
export class AddKlientPlModal {
  klient = '';
  telefon = '';
  adres = '';
  kod_klienta = '';
  numer = '';
  uwagi = '';
  lat: number | null = null;
  lng: number | null = null;

  isSaving = signal<boolean>(false);
  isGettingGps = signal<boolean>(false);

  constructor(public klientService: KlientPlService) {}

  get isOpen(): boolean {
    return this.klientService.isAddModalOpen();
  }

  close(): void {
    this.resetForm();
    this.klientService.closeAddModal();
  }

  private resetForm(): void {
    this.klient = '';
    this.telefon = '';
    this.adres = '';
    this.kod_klienta = '';
    this.numer = '';
    this.uwagi = '';
    this.lat = null;
    this.lng = null;
  }

  captureGps(): void {
    if (!navigator.geolocation) {
      alert('Twoje urządzenie nie obsługuje geolokalizacji');
      return;
    }

    this.isGettingGps.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.lat = parseFloat(pos.coords.latitude.toFixed(6));
        this.lng = parseFloat(pos.coords.longitude.toFixed(6));
        this.isGettingGps.set(false);
      },
      (err) => {
        this.isGettingGps.set(false);
        alert(`Błąd pobierania pozycji GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async save(): Promise<void> {
    if (!this.klient.trim() && !this.kod_klienta.trim() && !this.adres.trim()) {
      alert('Wpisz nazwę klienta, kod lub adres!');
      return;
    }

    this.isSaving.set(true);
    try {
      const newClientData: Partial<PolishClient> = {
        klient: this.klient.trim() || null,
        telefon: this.telefon.trim() || null,
        adres: this.adres.trim() || null,
        kod_klienta: this.kod_klienta.trim() || null,
        numer: this.numer.trim() || null,
        uwagi: this.uwagi.trim() || null,
        gps: this.lat !== null && this.lng !== null ? { lat: Number(this.lat), lng: Number(this.lng) } : null,
      };

      await this.klientService.addNewClient(newClientData);
      this.resetForm();
    } finally {
      this.isSaving.set(false);
    }
  }
}
