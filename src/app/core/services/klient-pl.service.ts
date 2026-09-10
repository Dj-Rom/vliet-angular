import { Injectable, signal, computed } from '@angular/core';
import rawClients from '../../../data/klient.json';
import { AlertService } from './alert.service';

export interface PolishClientGps {
  lat: number | null;
  lng: number | null;
}

export interface PolishClient {
  id: string;
  klient: string | null;
  telefon: string | null;
  adres: string | null;
  kod_klienta: string | null;
  numer: string | null;
  uwagi: string | null;
  gps?: PolishClientGps | null;
}

@Injectable({
  providedIn: 'root',
})
export class KlientPlService {
  readonly defaultSmsMessage = 'Dzień dobry! Będę u Państwa z dostawą za około 30 minut. Kierowca Vliet Transport.';

  // State
  clients = signal<PolishClient[]>([]);
  filterValue = signal<string>('');
  selectedClient = signal<PolishClient | null>(null);
  isModalOpen = signal<boolean>(false);

  // Filtered computed list
  filteredClients = computed(() => {
    const query = this.filterValue().trim().toLowerCase();
    const list = this.clients();
    if (!query) {
      return list;
    }

    return list.filter((client) => {
      const matchName = client.klient?.toLowerCase().includes(query) ?? false;
      const matchCode = client.kod_klienta?.toLowerCase().includes(query) ?? false;
      const matchNum = client.numer?.toLowerCase().includes(query) ?? false;
      const matchAddr = client.adres?.toLowerCase().includes(query) ?? false;
      const matchPhone = client.telefon?.toLowerCase().includes(query) ?? false;
      const matchNotes = client.uwagi?.toLowerCase().includes(query) ?? false;

      return matchName || matchCode || matchNum || matchAddr || matchPhone || matchNotes;
    });
  });

  constructor(private alert: AlertService) {
    this.initClients();
  }

  private initClients(): void {
    const parsed: PolishClient[] = (rawClients as any[]).map((c, index) => ({
      id: `pl-${index + 1}`,
      klient: c.klient || null,
      telefon: c.telefon ? String(c.telefon).trim() : null,
      adres: c.adres ? String(c.adres).trim() : null,
      kod_klienta: c.kod_klienta ? String(c.kod_klienta).trim() : null,
      numer: c.numer ? String(c.numer).trim() : null,
      uwagi: c.uwagi ? String(c.uwagi).trim() : null,
      gps: c.gps ? { lat: c.gps.lat ?? null, lng: c.gps.lng ?? null } : null,
    }));
    this.clients.set(parsed);
  }

  setFilter(val: string): void {
    this.filterValue.set(val);
  }

  clearFilter(): void {
    this.filterValue.set('');
  }

  openClient(client: PolishClient): void {
    this.selectedClient.set(client);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedClient.set(null);
  }

  /* ================= HELPERS & ACTIONS ================= */

  getCleanPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    // Standard Polish 9-digit mobile or landline
    if (cleaned.length === 9) {
      return `+48${cleaned}`;
    }
    return cleaned;
  }

  callClient(client: PolishClient): void {
    const phone = this.getCleanPhone(client.telefon);
    if (!phone) {
      this.alert.show('error', 'Brak numeru telefonu!');
      return;
    }
    window.location.href = `tel:${phone}`;
  }

  sendArrivalSms(client: PolishClient, messageText: string = this.defaultSmsMessage): void {
    const phone = this.getCleanPhone(client.telefon);
    if (!phone) {
      this.alert.show('error', 'Brak numeru telefonu!');
      return;
    }

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const smsUrl = `sms:${phone}${separator}body=${encodeURIComponent(messageText)}`;

    // Try opening native SMS app
    window.location.href = smsUrl;
  }

  async navigateClient(client: PolishClient): Promise<void> {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad/i.test(navigator.userAgent);

    if (client.gps?.lat && client.gps?.lng) {
      const lat = client.gps.lat;
      const lon = client.gps.lng;

      if (isMobile) {
        const hasTomTom = await this.checkAppInstalled('tomtomgo://');
        if (hasTomTom) {
          window.location.href = `tomtomgo://x-callback-url/navigate?lat=${lat}&lon=${lon}`;
          return;
        }
        if (isIOS) {
          window.location.href = `comgooglemaps://?q=${lat},${lon}&center=${lat},${lon}`;
        } else {
          window.location.href = `geo:${lat},${lon}?q=${lat},${lon}`;
        }
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
      }
      return;
    }

    if (client.adres) {
      const encodedAddress = encodeURIComponent(client.adres);
      if (isMobile) {
        if (isIOS) {
          window.location.href = `maps://?q=${encodedAddress}`;
        } else {
          window.location.href = `geo:0,0?q=${encodedAddress}`;
        }
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
      }
      return;
    }

    this.alert.show('error', 'Brak adresu lub współrzędnych GPS do nawigacji!');
  }

  copyToClipboard(text: string | null | undefined, label: string = 'Skopiowano!'): void {
    if (!text) {
      this.alert.show('error', 'Brak danych do skopiowania');
      return;
    }
    try {
      navigator.clipboard.writeText(text);
      this.alert.show('success', label);
    } catch {
      this.alert.show('error', 'Nie można skopiować');
    }
  }

  private checkAppInstalled(urlScheme: string): Promise<boolean> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = urlScheme;

      document.body.appendChild(iframe);

      const timeout = setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve(false);
      }, 1000);

      window.addEventListener(
        'blur',
        () => {
          clearTimeout(timeout);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve(true);
        },
        { once: true },
      );
    });
  }
}
