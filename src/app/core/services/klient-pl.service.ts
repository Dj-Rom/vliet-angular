import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import rawClients from '../../../data/klient.json';
import { AlertService } from './alert.service';
import { FirebaseClientService } from '../../firebase/firebase.service';
import { Unsubscribe } from 'firebase/firestore';

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
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class KlientPlService implements OnDestroy {
  readonly defaultSmsMessage =
    'Dzień dobry! Będę u Państwa z dostawą za około 30 minut. Kierowca Vliet Transport.';
  private readonly CACHE_KEY = 'vliet_polish_clients_cache';

  // State
  clients = signal<PolishClient[]>([]);
  isLoading = signal<boolean>(false);
  filterValue = signal<string>('');
  selectedClient = signal<PolishClient | null>(null);
  isModalOpen = signal<boolean>(false);
  isAddModalOpen = signal<boolean>(false);

  private unsubscribeSnapshot: Unsubscribe | null = null;
  private hasSeeded = false;

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

  constructor(
    private alert: AlertService,
    private fb: FirebaseClientService,
  ) {
    this.initClients();
    this.startRealtimeSync();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
  }

  private initClients(): void {
    // 1. Try restoring from local cache for instant zero-lag display
    const cached = this.readLocalCache();
    if (cached && cached.length > 0) {
      this.clients.set(cached);
      return;
    }

    // 2. Fallback to rawClients from JSON
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
    this.saveLocalCache(parsed);
  }

  private startRealtimeSync(): void {
    if (this.unsubscribeSnapshot) return;

    this.isLoading.set(true);
    this.unsubscribeSnapshot = this.fb.subscribeToPolishClients(
      (firestoreData: any[]) => {
        this.isLoading.set(false);

        // If Firestore is empty on initial setup, auto-seed the 137 clients from JSON
        if (firestoreData.length === 0 && !this.hasSeeded) {
          this.hasSeeded = true;
          this.seedInitialClients();
          return;
        }

        if (firestoreData.length > 0) {
          const list: PolishClient[] = firestoreData.map((d) => ({
            id: d.id,
            klient: d.klient || null,
            telefon: d.telefon || null,
            adres: d.adres || null,
            kod_klienta: d.kod_klienta || null,
            numer: d.numer || null,
            uwagi: d.uwagi || null,
            gps: d.gps ? { lat: d.gps.lat ?? null, lng: d.gps.lng ?? null } : null,
            createdAt: d.createdAt,
          }));

          this.clients.set(list);
          this.saveLocalCache(list);

          // If a client is currently open in modal, update its reference
          const current = this.selectedClient();
          if (current) {
            const updated = list.find((c) => c.id === current.id);
            if (updated) {
              this.selectedClient.set(updated);
            }
          }
        }
      },
      (error) => {
        this.isLoading.set(false);
        console.warn('Realtime sync error on Polish clients:', error);
      },
    );
  }

  private async seedInitialClients(): Promise<void> {
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

    try {
      await this.fb.batchSeedPolishClients(parsed);
      this.alert.show('success', 'Zsynchronizowano bazę klientów PL z Firebase!');
    } catch (e) {
      console.warn('Could not auto-seed Polish clients to Firebase:', e);
    }
  }

  /* ================= CRUD ACTIONS ================= */

  async addNewClient(data: Partial<PolishClient>): Promise<string> {
    const newClient: PolishClient = {
      id: '',
      klient: data.klient?.trim() || null,
      telefon: data.telefon?.trim() || null,
      adres: data.adres?.trim() || null,
      kod_klienta: data.kod_klienta?.trim() || null,
      numer: data.numer?.trim() || null,
      uwagi: data.uwagi?.trim() || null,
      gps: data.gps ? { lat: data.gps.lat ?? null, lng: data.gps.lng ?? null } : null,
    };

    try {
      const newId = await this.fb.addPolishClient(newClient);
      newClient.id = newId;

      // Optimistic local update
      this.clients.update((current) => [newClient, ...current]);
      this.saveLocalCache(this.clients());

      this.alert.show('success', 'Dodano nowego klienta PL!');
      this.closeAddModal();
      return newId;
    } catch (e) {
      this.alert.show('error', `Błąd dodawania: ${e}`);
      throw e;
    }
  }

  async updateClient(id: string, data: Partial<PolishClient>): Promise<void> {
    try {
      await this.fb.updatePolishClient(id, data);

      // Optimistic local update
      this.clients.update((current) =>
        current.map((c) => (c.id === id ? { ...c, ...data } : c)),
      );
      this.saveLocalCache(this.clients());

      const current = this.selectedClient();
      if (current && current.id === id) {
        this.selectedClient.set({ ...current, ...data });
      }

      this.alert.show('success', 'Zaktualizowano dane klienta!');
    } catch (e) {
      this.alert.show('error', `Błąd aktualizacji: ${e}`);
      throw e;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await this.fb.deletePolishClient(id);

      this.clients.update((current) => current.filter((c) => c.id !== id));
      this.saveLocalCache(this.clients());

      this.closeModal();
      this.alert.show('success', 'Klient został usunięty!');
    } catch (e) {
      this.alert.show('error', `Błąd usuwania: ${e}`);
      throw e;
    }
  }

  async updateClientGps(id: string, lat: number | null, lng: number | null): Promise<void> {
    const gps: PolishClientGps | null = lat !== null && lng !== null ? { lat, lng } : null;
    await this.updateClient(id, { gps });
  }

  captureDeviceGpsForClient(client: PolishClient): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Twoje urządzenie lub przeglądarka nie obsługuje geolokalizacji.';
        this.alert.show('error', msg);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));

          try {
            await this.updateClientGps(client.id, lat, lng);
            this.alert.show('success', `Zapisano współrzędne GPS: ${lat}, ${lng}`);
            resolve({ lat, lng });
          } catch (err) {
            reject(err);
          }
        },
        (error) => {
          let errorMsg = 'Nie udało się pobrać pozycji GPS.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Brak zgody na dostęp do lokalizacji GPS.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Sygnał GPS jest niedostępny.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Przekroczono czas oczekiwania na sygnał GPS.';
          }
          this.alert.show('error', errorMsg);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        },
      );
    });
  }

  /* ================= MODAL & FILTER HELPERS ================= */

  setFilter(val: string): void {
    this.filterValue.set(val);
  }

  clearFilter(): void {
    this.filterValue.set('');
  }

  openClient(client: PolishClient): void {
    this.selectedClient.set({ ...client });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedClient.set(null);
  }

  openAddModal(): void {
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  /* ================= ACTION HELPERS ================= */

  getCleanPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
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

  /* ================= LOCAL CACHE ================= */

  private readLocalCache(): PolishClient[] | null {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveLocalCache(list: PolishClient[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save polish clients cache:', e);
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
